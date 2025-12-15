import { TZDateMini } from "@date-fns/tz";
import {
  MusicEventsQueue,
  type MusicEventsQueueDataType,
  type MusicEventsQueueNameType,
} from "@music-event-connect/core/queue";
import { InjectQueue } from "@nestjs/bullmq";
import { Injectable, Logger } from "@nestjs/common";
import type { Queue } from "bullmq";
import { addDays, addHours, compareAsc, max, set } from "date-fns";
import type { ICronJobService } from "../../cron/cron-job-service.interface";
import { RateLimitError } from "./rate-limit.error";
import { TicketmasterApiProxy } from "./ticketmaster-api-proxy.service";
import type { AccessDate, Dates, Image } from "./ticketmaster-api.types";

@Injectable()
export class TicketmasterService implements ICronJobService {
  readonly #logger = new Logger(TicketmasterService.name);
  #currentPage = 0;
  #runDate = new Date(Date.now());
  readonly #scheduledHour = 2;

  readonly jobName = "ticketmaster";
  readonly jobType = "interval";

  constructor(
    @InjectQueue(MusicEventsQueue.name)
    private readonly musicEventsQueue: Queue<
      MusicEventsQueueDataType,
      MusicEventsQueueDataType,
      MusicEventsQueueNameType
    >,
    private readonly ticketmasterApi: TicketmasterApiProxy
  ) {}

  getRunDate(): Date {
    return this.#runDate;
  }

  isInProcess() {
    return this.#currentPage !== 0;
  }

  #computeNextRunDate() {
    const now = new Date();
    let runDate = set(now, {
      hours: this.#scheduledHour,
      minutes: 0,
      seconds: 0,
      milliseconds: 0,
    });

    while (runDate.getTime() <= Date.now()) {
      runDate = addDays(runDate, 1);
    }

    this.#logger.log("Next run date: " + runDate.toJSON());
    return runDate;
  }

  #setNewStartDate(availabilityInMsUTC: number) {
    const nextAvailableDate = new Date(availabilityInMsUTC);
    const nextPeriodDate = this.#computeNextRunDate();
    this.#runDate = max([nextAvailableDate, nextPeriodDate]);
  }

  /**
   * Access date holds only the local time but is represented as UTC date string.
   * @param refDate reference Date from which we create correct date (year, month, day)
   */
  #getAccessDate(accessDates: AccessDate | undefined, refDate: Date): Date | undefined {
    const dateTimeStr = accessDates?.startDateTime;

    if (!dateTimeStr || Number.isNaN(refDate.getTime())) {
      return undefined;
    }

    const incorrectAccessDate = new Date(dateTimeStr);
    incorrectAccessDate.setUTCFullYear(refDate.getUTCFullYear());
    incorrectAccessDate.setUTCMonth(refDate.getUTCMonth());
    incorrectAccessDate.setUTCDate(refDate.getUTCDate());
    // `AccessDate.startDateTime` is incorrect - it is 1 hour more than it should be
    return addHours(incorrectAccessDate, -1);
  }

  #getEventDoorTime(accessDates: AccessDate | undefined, startDate: Date): Date | undefined {
    const doorTime = this.#getAccessDate(accessDates, startDate);

    if (!doorTime) {
      return undefined;
    }

    return compareAsc(doorTime, startDate) === 1 ? undefined : doorTime;
  }

  #getEventStartDate(dates: Dates): Date {
    if (dates.start.dateTime) {
      return new Date(dates.start.dateTime);
    }
    if (dates.start.localDate && dates.start.localTime) {
      const localDateTimeStr = `${dates.start.localDate}T${dates.start.localTime}`;
      return new TZDateMini(localDateTimeStr, dates.timezone);
    }

    const tzDate = new TZDateMini(dates.start.localDate, dates.timezone);
    return this.#getAccessDate(dates.access, tzDate) ?? tzDate;
  }

  #getEventEndDate(dates: Dates): Date | undefined {
    if (dates.end?.dateTime) {
      return new Date(dates.end.dateTime);
    }
    if (dates.end?.localDate && dates.end?.localTime) {
      const localDateTimeStr = `${dates.end.localDate}T${dates.end.localTime}`;
      return new TZDateMini(localDateTimeStr, dates.timezone);
    }
    return undefined;
  }

  #normalizeUrl(urlStr: string): string {
    if (!URL.canParse(urlStr)) {
      return urlStr.split(/[?#]/g)[0]!;
    }

    const url = new URL(urlStr);
    url.search = "";
    url.hash = "";
    return url.toString();
  }

  #getUniqueArtistImages(images: Image[]): Image[] {
    const getCommonUrlPrefix = (url: string) => {
      const urlPrefixIndex = url.lastIndexOf("/");
      if (urlPrefixIndex === -1) {
        return url;
      }
      return url.substring(0, urlPrefixIndex);
    };

    const filteredImages = images.reduce((map, image) => {
      const prefix = getCommonUrlPrefix(image.url);

      if (!map.has(prefix)) {
        return map.set(prefix, image);
      }

      const mapImage = map.get(prefix)!;
      const imageSize = image.width * image.height;
      const mapImageSize = mapImage.width * mapImage.height;

      // get the larger size for the same image
      if (imageSize > mapImageSize) {
        map.set(prefix, image);
      }

      return map;
    }, new Map<string, Image>());
    return Array.from(filteredImages.values());
  }

  async run() {
    let data: Awaited<ReturnType<typeof this.ticketmasterApi.getMusicEvents>>;

    try {
      data = await this.ticketmasterApi.getMusicEvents(this.#currentPage);
    } catch (e) {
      if (e instanceof RateLimitError) {
        this.#setNewStartDate(e.resetTime);
      }
      if (e instanceof Error) {
        this.#logger.error(e.message, e.stack);
      } else {
        this.#logger.error(e);
      }
      return;
    }

    if (!data._embedded || data.page.number >= data.page.totalPages) {
      this.#logger.log("No more events.");
      this.#currentPage = 0;
      this.#runDate = this.#computeNextRunDate();
      return;
    }

    this.#currentPage++;

    // extract music event data
    const musicEvents = data._embedded.events.map<MusicEventsQueueDataType>((event) => {
      const startDate = this.#getEventStartDate(event.dates);
      return {
        event: {
          id: event.id.trim(),
          name: event.name.trim(),
          url: this.#normalizeUrl(event.url), // remove the language URL query param
          doorTime: this.#getEventDoorTime(event.dates.access, startDate),
          startDate,
          endDate: this.#getEventEndDate(event.dates),
          artists: event._embedded.attractions
            .filter(
              (a) =>
                !a.classifications
                  .map((c) => c.subType.name)
                  .flat()
                  .includes("Concert")
            )
            .map((a) => ({
              name: a.name.trim(),
              genres: [...new Set(a.classifications.map((c) => [c.genre.name.trim(), c.subGenre.name.trim()]).flat())],
              sameAs: a.externalLinks
                ? Object.values(a.externalLinks)
                    .flat()
                    .map((url) => url.url)
                    .filter((url) => url.startsWith("http"))
                : [],
              images: this.#getUniqueArtistImages(a.images).map((img) => img.url),
            })),
          venues: event._embedded.venues.map((v) => ({
            name: v.name.trim(),
            latitude: Number(v.location.latitude) || undefined,
            longitude: Number(v.location.longitude) || undefined,
            address: {
              country: "CZ",
              locality: v.city.name.trim(),
              street: v.address.line1.trim(),
            },
          })),
          ticket: {
            url: this.#normalizeUrl(event.url), // remove the language URL query param
            availability: event.dates.status.code === "onsale" ? "InStock" : "SoldOut",
          },
          images: [], // Ticketmaster has artist's images
        },
      };
    });
    // add data to the queue
    await this.musicEventsQueue.addBulk(musicEvents.map((event) => ({ name: "ticketmaster", data: event })));
  }
}
