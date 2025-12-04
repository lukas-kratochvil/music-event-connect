import type { IAddress } from "./address.interface";

/**
 * The place where the concert is happening.
 */
export interface IVenue {
  /**
   * The unique identifier.
   */
  id: string;

  /**
   * The name.
   */
  name: string;

  /**
   * The address.
   */
  address: IAddress;

  /**
   * The latitude of a location.
   */
  latitude: number | undefined;

  /**
   * The longitude of a location.
   */
  longitude: number | undefined;

  /**
   * Images of the venue.
   */
  // TODO: also add images?
  // images: string[];
}
