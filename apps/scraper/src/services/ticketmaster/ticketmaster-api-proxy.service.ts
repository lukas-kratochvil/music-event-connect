import { Injectable, Logger } from "@nestjs/common";
import Bottleneck from "bottleneck";
import type { ITicketmasterApi } from "./ticketmaster-api.interface";
import { TicketmasterApi } from "./ticketmaster-api.service";
import { TicketmasterEventsResponse, type TicketmasterEventsData } from "./ticketmaster-api.types";

@Injectable()
export class TicketmasterApiProxy implements ITicketmasterApi {
  readonly #logger = new Logger(TicketmasterApiProxy.name);

  /**
   * The default quota is 5000 API calls per day and rate limitation of 5 requests/second.
   *
   * See: https://developer.ticketmaster.com/products-and-docs/apis/getting-started/#rate-limit
   */
  readonly #rateLimiter: Bottleneck;

  constructor(private readonly ticketmasterApi: TicketmasterApi) {
    const dayRateLimiter = new Bottleneck({
      id: "ticketmaster-api-limiter-day",
      // 5000 request/day
      reservoir: 5000,
      reservoirRefreshAmount: 5000,
      reservoirRefreshInterval: 1000 * 60 * 60 * 24,
      minTime: 1000,
      maxConcurrent: 1,
    });
    const secondsRateLimiter = new Bottleneck({
      id: "ticketmaster-api-limiter-sec",
      // 5 request/second
      minTime: 200,
      maxConcurrent: 1,
    });
    this.#rateLimiter = secondsRateLimiter.chain(dayRateLimiter);
  }

  async getMusicEvents(page: number): Promise<Extract<TicketmasterEventsResponse, TicketmasterEventsData>> {
    try {
      return this.#rateLimiter.schedule(() => this.ticketmasterApi.getMusicEvents(page));
    } catch (e) {
      if (e instanceof Error) {
        this.#logger.error(e.message, e.stack);
      } else {
        this.#logger.error(e);
      }
      throw e;
    }
  }
}
