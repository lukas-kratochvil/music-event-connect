import type { ItemAvailability } from "../../interfaces/ticket.interface";

export interface IEventAccount {
  name: string;
  url: string;
}

export interface IEventArtist {
  name: string;
  genres?: string[];
  urls?: string[];
  accounts?: IEventAccount[];
  images?: string[];
}

export interface IEventAddress {
  street: string | undefined;
  locality: string;
  country: string;
}

export const SpotNearby = {
  busStop: "bus_stop",
  tramStop: "tram_stop",
  subwayStation: "subway_station",
  bar: "bar",
  pub: "pub",
  restaurant: "restaurant",
} as const;

export type SpotNearby = (typeof SpotNearby)[keyof typeof SpotNearby];

export interface IEventSpotNearby {
  name: string;
  type: SpotNearby;
  latitude: number;
  longitude: number;
  distInM: number;
}

export interface IEventVenue {
  name: string;
  latitude: number;
  longitude: number;
  address: IEventAddress;
  spotsNearby: IEventSpotNearby[];
}

export interface IEventOffer {
  url: string;
  availability: ItemAvailability;
}

export interface IEvent {
  id: string;
  name: string;
  doorTime: Date | undefined;
  startDate: Date;
  endDate: Date | undefined;
  images?: string[];
  artists?: IEventArtist[];
  venues: IEventVenue[];
  offers: IEventOffer[];
}
