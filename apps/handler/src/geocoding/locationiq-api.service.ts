import { HttpService } from "@nestjs/axios";
import { Injectable } from "@nestjs/common";
import { AxiosError } from "axios";
import { catchError, firstValueFrom } from "rxjs";
import type { Address, Coordinates, ILocationIQApi } from "./locationiq-api.interface";
import type { LocationIQSearchStructuredResponse } from "./locationiq-api.types";

@Injectable()
export class LocationIQApi implements ILocationIQApi {
  constructor(private readonly http: HttpService) {}

  /**
   * Returns the best search result based on the provided `matchers` or the `sortComparator`.
   * The `sortComparator` is used after non of the matchers succeeded.
   * @param results Search results
   * @param matchers Matchers used to find the best result
   * @param sortComparator Determines the order of the elements. Returns a negative value if the first argument is less than the second argument, zero if they're equal, and a positive value otherwise.
   * @returns One of the results. Defaults to the first result in the array if the `sortComparator` is provided.
   */
  #getTheBestSearchResult<TResult>(
    results: TResult[],
    matchers: ((loc: TResult) => boolean | undefined)[],
    sortComparator?: (a: TResult, b: TResult) => number
  ): TResult {
    for (const matcher of matchers) {
      const location = results.find(matcher);
      if (location) {
        return location;
      }
    }

    // first result (optional sorting)
    return sortComparator ? results.toSorted(sortComparator)[0]! : results[0]!;
  }

  async search(name: string, address: Address): Promise<Coordinates> {
    const res = await firstValueFrom(
      this.http
        .get<LocationIQSearchStructuredResponse>("search/structured", {
          // API reference: https://docs.locationiq.com/reference/search-structured
          params: {
            // JSON or XML (case-insensitive)
            format: "json",
            // limit search to a comma-separated list of countries - (case-insensitive) ISO 3166-1 alpha-2 codes (https://docs.locationiq.com/docs/country-codes)
            countrycodes: "cz",
            // https://docs.locationiq.com/docs/normalize-address
            normalizeaddress: 1,
            // include a breakdown of the address
            addressdetails: 1,
            // structured query
            country: address.country,
            city: address.locality,
            street: address.street,
          },
        })
        .pipe(
          catchError(
            (error: AxiosError<LocationIQSearchStructuredResponse>) =>
              new Promise<AxiosError<LocationIQSearchStructuredResponse>>((resolve) => resolve(error))
          )
        )
    );

    if (res instanceof AxiosError) {
      throw new Error(res.message);
    }

    const { data: locations, status, statusText } = res;

    if (status === 404) {
      throw new Error("Location not found");
    }
    if (status === 429) {
      throw new Error("Request exceeded the rate-limits set on the account");
    }
    if (status !== 200) {
      throw new Error(statusText);
    }

    const location = this.#getTheBestSearchResult(
      locations,
      [
        // match location by address name (e.g. a music club name)
        (loc) => loc.address?.name === name,
        (loc) => loc.address?.name?.includes(name),
        // match location by display name (can contain e.g. a music club name)
        (loc) => loc.display_name.includes(name),
      ],
      (loc1, loc2) => loc2.importance - loc1.importance
    );
    return {
      latitude: +location.lat,
      longitude: +location.lon,
    };
  }
}
