type DateRange = {
  from: Date | undefined;
  to: Date | undefined;
};

export interface EventsFilters {
  artistNames?: string[];
  startDateRange?: DateRange;
}
