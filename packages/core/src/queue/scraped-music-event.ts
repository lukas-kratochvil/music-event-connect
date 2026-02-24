import type { ItemAvailability } from "@music-event-connect/shared/interfaces";

export type ScrapedMusicEvent = {
  /**
   * Music event identifier specific for the scraped site.
   */
  id: string;

  /**
   * The event name.
   */
  name: string;

  /**
   * The URL of the event.
   */
  url: string;

  /**
   * The event opening date.
   */
  doorTime: Date | undefined;

  /**
   * The start date of the event.
   */
  startDate: Date;

  /**
   * The end date of the event.
   */
  endDate: Date | undefined;

  /**
   * Artists performing on this event.
   */
  artists: Artist[];

  /**
   * Venues where the music event takes place.
   */
  venues: Venue[];

  /**
   * The concert ticket info.
   */
  ticket: Ticket;

  /**
   * Images for the event.
   */
  images: string[];
};

type Artist = {
  /**
   * Name of the artist.
   */
  name: string;

  /**
   * Names of music genres of artist's work.
   */
  genres: string[];

  /**
   * Links to artist's profiles.
   */
  profiles: string[];

  /**
   * Images of the artist.
   */
  images: string[];
};

type Venue = {
  /**
   * Name of the venue.
   */
  name: string;

  /**
   * The latitude of a location.
   */
  latitude: number | undefined;

  /**
   * The longitude of a location.
   */
  longitude: number | undefined;
  /**
   * The address.
   */
  address: Address;
};

type Address = {
  /**
   * The country in 2-letter [ISO 3166-1 alpha-2](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2) format.
   *
   * Currently supporting only CZ.
   */
  country: "CZ";

  /**
   * The locality in which the street address is, and which is in the region (e.g. city).
   */
  locality: string;

  /**
   * The street address.
   */
  street: string | undefined;
};

type Ticket = {
  /**
   * The URL to obtain the ticket.
   */
  url: string;

  /**
   * The availability of the ticket.
   */
  availability: ItemAvailability;
};
