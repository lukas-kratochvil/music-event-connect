import type { ScrapedMusicEvent } from "@music-event-connect/core/queue";

export type Address = ScrapedMusicEvent["venues"][number]["address"];

export type Coordinates = {
  latitude: number;
  longitude: number;
};

export interface ILocationIQApi {
  /**
   * Performs geocoding to get the location fot the given place.
   *
   * @param name name of the place
   * @param address address of the place
   * @returns coordinates (latitude, longitude) for the given place
   */
  search: (name: string, address: Address) => Promise<Coordinates>;
}
