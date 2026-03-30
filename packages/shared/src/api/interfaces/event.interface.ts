import type { ItemAvailability } from "../../interfaces/ticket.interface";

interface IEventAccount {
  name: string;
  url: string;
}

interface IEventArtist {
  name: string;
  genres: string[];
  urls: string[];
  accounts: IEventAccount[];
  images: string[];
}

interface IEventAddress {
  street: string | undefined;
  locality: string;
  country: string;
}

interface IEventVenue {
  name: string;
  latitude: number;
  longitude: number;
  address: IEventAddress;
}

interface IEventOffer {
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
