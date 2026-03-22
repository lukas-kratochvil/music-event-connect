type DateRange = {
  from: Date | undefined;
  to: Date | undefined;
};

export type EventsFilters = {
  artistNames?: string[];
  startDateRange?: DateRange;
};
