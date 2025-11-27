import type { ItemAvailability } from "../interfaces";

export type ScrapedMusicEvent = {
  id: string;
  name: string;
  url: string;
  doorTime: Date | undefined;
  startDate: Date;
  endDate: Date | undefined;
  artists: Artist[];
  venues: Venue[];
  ticket: Ticket;
};

type Artist = {
  name: string;
  genres: string[];
  sameAs: string[];
};

type Venue = {
  name: string;
  latitude: number | undefined;
  longitude: number | undefined;
  address: Address;
};

type Address = {
  country: "CZ";
  locality: string;
  street: string | undefined;
};

type Ticket = {
  url: string;
  availability: ItemAvailability;
};
