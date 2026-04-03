import type { ItemAvailability } from "../../interfaces/ticket.interface";

//----------------------------------------------------
// Search options
//----------------------------------------------------
export interface IEventSearchPagination {
  offset: number;
  limit: number;
}

export interface IEventSearchDateRange {
  from: Date | undefined;
  to?: Date | undefined;
}

export interface IEventSearchFilters {
  artistNames?: string[];
  startDateRange?: IEventSearchDateRange;
}

export interface IEventSearchSorters {
  startDate?: {
    desc?: boolean;
  };
}

export interface IEventSearchOptions {
  pagination: IEventSearchPagination;
  filters?: IEventSearchFilters;
  sorters?: IEventSearchSorters;
}

//----------------------------------------------------
// Searched entity
//----------------------------------------------------
export interface IEventSearchArtist {
  name: string;
  images: string[];
}

export interface IEventSearchAddress {
  locality: string;
  country: string;
}

export interface IEventSearchVenue {
  name: string;
  address: IEventSearchAddress;
}

export interface IEventSearchOffer {
  url: string;
  availability: ItemAvailability;
}

export interface IEventSearch {
  id: string;
  name: string;
  startDate: Date;
  images: string[];
  artists: IEventSearchArtist[];
  venues: IEventSearchVenue[];
  offers: IEventSearchOffer[];
}
