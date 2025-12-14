import { CACHE_MANAGER, Cache } from "@nestjs/cache-manager";
import { Inject, Injectable, Logger } from "@nestjs/common";
import Bottleneck from "bottleneck";
import type { Address, Coordinates, ILocationIQApi } from "./locationiq-api.interface";
import { LocationIQApi } from "./locationiq-api.service";

/**
 * LocationIQ max allowed caching time for free users is 48 hours.
 *
 * See section "What’s your caching policy?" at https://locationiq.com/pricing.
 */
const LOCATIONIQ_MAX_ALLOWED_CACHE_TTL = 1000 * 60 * 60 * 48;

@Injectable()
export class LocationIQApiProxy implements ILocationIQApi {
  readonly #logger = new Logger(LocationIQApiProxy.name);

  /**
   * The default quota is 5000 API calls per day and rate limitations of 60 request/minute and 2 requests/second.
   *
   * See: https://locationiq.com/pricing
   */
  readonly #rateLimiter: Bottleneck;

  constructor(
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    private readonly locationIQApi: LocationIQApi
  ) {
    const dayRateLimiter = new Bottleneck({
      id: "locationiq-api-limiter-day",
      // 5000 request/day
      reservoir: 5000,
      reservoirRefreshAmount: 5000,
      reservoirRefreshInterval: 1000 * 60 * 60 * 24,
      minTime: 1000,
      maxConcurrent: 1,
    });
    const minuteRateLimiter = new Bottleneck({
      id: "locationiq-api-limiter-min",
      // 60 request/minute
      reservoir: 60,
      reservoirRefreshAmount: 60,
      reservoirRefreshInterval: 1000 * 60,
      minTime: 0,
      maxConcurrent: null,
    });
    const secondsRateLimiter = new Bottleneck({
      id: "locationiq-api-limiter-sec",
      // 2 request/second
      minTime: 500,
      maxConcurrent: 1,
    });
    this.#rateLimiter = secondsRateLimiter.chain(minuteRateLimiter).chain(dayRateLimiter);
  }

  async search(name: string, address: Address): Promise<Coordinates> {
    type GeocodingCacheValueType = Awaited<ReturnType<typeof this.locationIQApi.search>>;
    const cacheKey = (address.street ? address.street + ", " : "") + address.locality + ", " + address.country;
    const cacheResult = await this.cache.get<GeocodingCacheValueType>(cacheKey);

    if (cacheResult) {
      return cacheResult;
    }

    try {
      const coords = await this.#rateLimiter.schedule(() => this.locationIQApi.search(name, address));
      await this.cache.set<GeocodingCacheValueType>(cacheKey, coords, LOCATIONIQ_MAX_ALLOWED_CACHE_TTL);
      return coords;
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
