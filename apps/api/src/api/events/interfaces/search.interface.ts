type SearchEventsPagination = {
  offset: number;
  limit: number;
};

type DateRange = {
  from: Date | undefined;
  to: Date | undefined;
};

interface SearchEventsFilters {
  artistNames?: string[];
  startDateRange?: DateRange;
}

interface SearchEventsSorter {
  propertyName: string;
  desc?: boolean;
}

export interface SearchEventsOptions {
  pagination: SearchEventsPagination;
  filters?: SearchEventsFilters;
  sorters?: SearchEventsSorter[];
}
