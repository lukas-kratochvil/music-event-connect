type DateRange = {
  from: Date | undefined;
  to: Date | undefined;
};

export interface EventsFilters {
  artistNames?: string[];
  startDateRange?: DateRange;
}

export const SortType = {
  asc: "asc",
  desc: "desc",
} as const;

export type SortType = (typeof SortType)[keyof typeof SortType];

export interface EventsSorter {
  propertyName: string;
  type: SortType;
}
