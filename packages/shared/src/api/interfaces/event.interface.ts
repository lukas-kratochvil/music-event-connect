import type { ItemAvailability } from "../../interfaces/ticket.interface";

export interface IEventAccount {
  name: string;
  url: string;
}

export interface IEventArtist {
  name: string;
  genres: string[];
  urls: string[];
  accounts: IEventAccount[];
  images: string[];
}

export interface IEventAddress {
  street: string | undefined;
  locality: string;
  country: string;
}

export interface IEventVenue {
  name: string;
  latitude: number;
  longitude: number;
  address: IEventAddress;
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
  images: string[];
  artists: IEventArtist[];
  venues: IEventVenue[];
  offer: IEventOffer;
}
