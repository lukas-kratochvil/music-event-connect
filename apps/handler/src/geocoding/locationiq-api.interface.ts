import type { ScrapedMusicEvent } from "@music-event-connect/core/queue";

export type GeoForwardAddressParam = ScrapedMusicEvent["venues"][number]["address"];

export type GeoCoordinates = {
  latitude: number;
  longitude: number;
};

export type GeoAddress = {
  locality: string;
};

export interface ILocationIQApi {
  /**
   * Performs the forward geocoding to get the geographic coordinates for the given place.
   *
   * @param name name of the place
   * @param address address of the place
   * @returns coordinates (latitude, longitude) for the given place
   */
  geocodeForward: (name: string, address: GeoForwardAddressParam) => Promise<GeoCoordinates>;

  /**
   * Performs the reverse geocoding to get the address for the given place.
   *
   * @param coords coordinates (latitude, longitude) of the place
   * @returns address for the given place
   */
  geocodeReverse(coords: GeoCoordinates): Promise<GeoAddress>;
}
