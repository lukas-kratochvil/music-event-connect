import { TZDateMini } from "@date-fns/tz";
import {
  type MusicEventsQueueDataType,
  type MusicEventsQueueNameType,
  MusicEventsQueue,
} from "@music-event-connect/core/queue";
import { HttpService } from "@nestjs/axios";
import { InjectQueue } from "@nestjs/bullmq";
import { Injectable, Logger } from "@nestjs/common";
import { AxiosError } from "axios";
import type { Queue } from "bullmq";
import { addDays, addHours, compareAsc, max, set } from "date-fns";
import { catchError, firstValueFrom } from "rxjs";
import type { ICronJobService } from "../../cron/cron-job-service.interface";
import { TicketmasterResponse, type AccessDate, type Dates } from "./ticketmaster-api.types";

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
    private readonly http: HttpService
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

  async run() {
    // The default quota is 5000 API calls per day and rate limitation of 5 requests per second.
    // Deep Paging: only supports retrieving the 1000th item. i.e. (size * page < 1000).
    const res = await firstValueFrom(
      this.http
        .get<TicketmasterResponse>("events.json", {
          params: {
            page: this.#currentPage, // `page` behaves like an offset, default `size` is 20 items per page
            countryCode: "cz",
            classificationName: ["music"],
            sort: "date,name,asc",
            locale: "en", // values adjusted to a given locale (names, URLs etc.)
          },
        })
        .pipe(
          catchError(
            (error: AxiosError<TicketmasterResponse>) =>
              new Promise<AxiosError<TicketmasterResponse>>((resolve) => resolve(error))
          )
        )
    );

    if (res instanceof AxiosError) {
      this.#logger.error(res.message);
      return;
    }

    const { data, headers, status } = res;

    // headers["rate-limit"] - what’s the rate limit available to you, the default is 5000
    // headers["rate-limit-available"] - how many requests are available to you, this will be 5000 minus all the requests you’ve done
    // headers["rate-limit-over"] - how many requests over your quota you’ve made
    // headers["rate-limit-reset"] - the UTC date and time of when your quota will be reset
    this.#logger.log(
      `Limit: ${headers["rate-limit"]}, Available: ${headers["rate-limit-available"]}, Over: ${headers["rate-limit-over"]}, Reset: ${headers["rate-limit-reset"]}`
    );

    if ("fault" in data) {
      // HTTP 401 - invalid API key
      // HTTP 429 - quota reached
      if (status === 429) {
        this.#setNewStartDate(Number(headers["rate-limit-reset"]));
      }

      this.#logger.error(data.fault.faultstring);
      return;
    }

    if (!data._embedded || data.page.number >= data.page.totalPages) {
      this.#logger.log("No more events.");
      this.#currentPage = 0;
      this.#setNewStartDate(Number(headers["rate-limit-reset"]));
      return;
    }

    this.#currentPage++;

    // extract music event data
    const musicEvents = data._embedded.events.map<MusicEventsQueueDataType>((event): MusicEventsQueueDataType => {
      const startDate = this.#getEventStartDate(event.dates);
      return {
        event: {
          name: event.name.trim(),
          url: event.url,
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
            url: event.url.trim(),
            availability: event.dates.status.code === "onsale" ? "InStock" : "SoldOut",
          },
        },
      };
    });
    // add data to the queue
    await this.musicEventsQueue.addBulk(musicEvents.map((event) => ({ name: "ticketmaster", data: event })));
  }
}
