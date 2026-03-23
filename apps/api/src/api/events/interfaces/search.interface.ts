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

export const SortType = {
  asc: "asc",
  desc: "desc",
} as const;

export type SortType = (typeof SortType)[keyof typeof SortType];

interface SearchEventsSorter {
  propertyName: string;
  type: SortType;
}

export interface SearchEventsOptions {
  pagination: SearchEventsPagination;
  filters?: SearchEventsFilters;
  sorters?: SearchEventsSorter[];
}
