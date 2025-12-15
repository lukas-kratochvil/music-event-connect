import { HttpService } from "@nestjs/axios";
import { Injectable } from "@nestjs/common";
import { AxiosError } from "axios";
import { catchError, firstValueFrom } from "rxjs";
import { RateLimitError } from "./rate-limit.error";
import type { ITicketmasterApi } from "./ticketmaster-api.interface";
import { TicketmasterEventsResponse, type TicketmasterEventsData } from "./ticketmaster-api.types";

@Injectable()
export class TicketmasterApi implements ITicketmasterApi {
  constructor(private readonly http: HttpService) {}

  async getMusicEvents(page: number): Promise<Extract<TicketmasterEventsResponse, TicketmasterEventsData>> {
    const res = await firstValueFrom(
      this.http
        // Deep Paging: only supports retrieving the 1000th item. i.e. (size * page < 1000).
        .get<TicketmasterEventsResponse>("events.json", {
          params: {
            page, // `page` behaves like an offset, default `size` is 20 items per page
            countryCode: "cz",
            classificationName: ["music"],
            sort: "date,name,asc",
            locale: "en", // values adjusted to a given locale (names, URLs etc.)
          },
        })
        .pipe(
          catchError(
            (error: AxiosError<TicketmasterEventsResponse>) =>
              new Promise<AxiosError<TicketmasterEventsResponse>>((resolve) => resolve(error))
          )
        )
    );

    if (res instanceof AxiosError) {
      throw new Error(res.message);
    }

    const { data, headers, status, statusText } = res;
    // headers["rate-limit"] - what’s the rate limit available to you, the default is 5000
    // headers["rate-limit-available"] - how many requests are available to you, this will be 5000 minus all the requests you’ve done
    // headers["rate-limit-over"] - how many requests over your quota you’ve made
    // headers["rate-limit-reset"] - the UTC date and time of when your quota will be reset

    if (status === 429) {
      throw new RateLimitError(headers["rate-limit-reset"], "Request exceeded the rate-limit");
    }
    if (status !== 200) {
      throw new Error(statusText);
    }
    if ("fault" in data) {
      throw new Error(data.fault.faultstring);
    }

    return data;
  }
}
