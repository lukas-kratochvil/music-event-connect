import {
  MusicEventsQueue,
  type MusicEventsQueueDataType,
  type MusicEventsQueueNameType,
} from "@music-event-connect/core/queue";
import { InjectQueue } from "@nestjs/bullmq";
import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Queue } from "bullmq";
import { addDays, compareAsc, max, set } from "date-fns";
import type { ConfigSchema } from "../../config/schema";
import type { ICronJobService } from "../../cron/cron-job-service.interface";
import { getLocalizedDate } from "../../utils/date";
import { RateLimitError } from "./rate-limit.error";
import { TicketmasterApiProxy } from "./ticketmaster-api-proxy.service";
import type { Dates, Image } from "./ticketmaster-api.types";

@Injectable()
export class TicketmasterService implements ICronJobService {
  readonly #logger = new Logger(TicketmasterService.name);
  readonly #scheduledTime: NonNullable<ConfigSchema["services"]["ticketmaster"]>["scheduledTime"];
  #currentPage = 0;
  #runDate = new Date(Date.now());

  readonly jobName = "ticketmaster";
  readonly jobType = "interval";

  constructor(
    @InjectQueue(MusicEventsQueue.name)
    private readonly musicEventsQueue: Queue<
      MusicEventsQueueDataType,
      MusicEventsQueueDataType,
      MusicEventsQueueNameType
    >,
    private readonly ticketmasterApi: TicketmasterApiProxy,
    config: ConfigService<ConfigSchema, true>
  ) {
    const ticketmasterConfig = config.get("services.ticketmaster", { infer: true });
    if (!ticketmasterConfig) {
      throw new Error("Config not present!");
    }
    this.#scheduledTime = ticketmasterConfig.scheduledTime;
  }

  getRunDate(): Date {
    return this.#runDate;
  }

  isInProcess() {
    return this.#currentPage !== 0;
  }

  #computeNextRunDate() {
    const now = new Date();
    let runDate = set(now, {
      ...this.#scheduledTime,
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

  #getAccessDate(dates: Dates) {
    // access date holds the local datetime but is represented as the UTC date string
    const dateTimeStr = dates.access?.startDateTime?.split("Z")[0];
    return dateTimeStr ? getLocalizedDate(dateTimeStr, "yyyy-MM-dd'T'HH:mm:ss", dates.timezone) : undefined;
  }

  #getEventDoorTime(dates: Dates, startDate: Date) {
    const doorTime = this.#getAccessDate(dates);
    if (!doorTime) {
      return undefined;
    }
    // doors must be before the event start date
    return compareAsc(doorTime, startDate) === 1 ? undefined : doorTime;
  }

  #getEventStartDate(dates: Dates) {
    if (dates.start.dateTime) {
      return new Date(dates.start.dateTime);
    }
    if (dates.start.localDate && dates.start.localTime) {
      const localDateTimeStr = `${dates.start.localDate}T${dates.start.localTime}`;
      return getLocalizedDate(localDateTimeStr, "yyyy-MM-dd'T'HH:mm:ss", dates.timezone);
    }
    return this.#getAccessDate(dates) ?? getLocalizedDate(dates.start.localDate, "yyyy-MM-dd", dates.timezone);
  }

  #getEventEndDate(dates: Dates) {
    if (dates.end?.dateTime) {
      return new Date(dates.end.dateTime);
    }
    if (dates.end?.localDate && dates.end?.localTime) {
      const localDateTimeStr = `${dates.end.localDate}T${dates.end.localTime}`;
      return getLocalizedDate(localDateTimeStr, "yyyy-MM-dd'T'HH:mm:ss", dates.timezone);
    }
    return undefined;
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
          url: event.url,
          doorTime: this.#getEventDoorTime(event.dates, startDate),
          startDate,
          endDate: this.#getEventEndDate(event.dates),
          artists: event._embedded.attractions
            .filter(
              (attraction) =>
                !attraction.classifications
                  .map((classification) => classification.subType.name)
                  .flat()
                  .includes("Concert")
            )
            .map((attraction) => ({
              name: attraction.name.trim(),
              genres: [
                ...new Set(
                  attraction.classifications
                    .map((classification) => [classification.genre.name.trim(), classification.subGenre.name.trim()])
                    .flat()
                ),
              ],
              webSites: attraction.externalLinks
                ? [
                    ...new Set(
                      Object.values(attraction.externalLinks)
                        .flat()
                        .map((url) => url.url)
                        .filter((url) => url.startsWith("http"))
                    ),
                  ]
                : [],
              images: this.#getUniqueArtistImages(attraction.images).map((img) => img.url),
            })),
          venues: event._embedded.venues.map((venue) => ({
            name: venue.name.trim(),
            latitude: Number(venue.location.latitude) || undefined,
            longitude: Number(venue.location.longitude) || undefined,
            address: {
              country: "CZ",
              locality: venue.city?.name?.trim(),
              street: venue.address?.line1?.trim(),
            },
          })),
          ticket: {
            url: event.url,
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
