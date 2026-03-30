import type { ItemAvailability } from "../../interfaces/ticket.interface";

type IEventSearchPagination = {
  offset: number;
  limit: number;
};

type DateRange = {
  from: Date | undefined;
  to?: Date | undefined;
};

interface IEventSearchFilters {
  artistNames?: string[];
  startDateRange?: DateRange;
}

interface IEventSearchSorter {
  propertyName: string;
  desc?: boolean;
}

export interface IEventSearchOptions {
  pagination: IEventSearchPagination;
  filters?: IEventSearchFilters;
  sorters?: IEventSearchSorter[];
}

interface IEventSearchArtist {
  name: string;
}

interface IEventSearchAddress {
  locality: string;
  country: string;
}

interface IEventSearchVenue {
  name: string;
  address: IEventSearchAddress;
}

interface IEventSearchOffer {
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
