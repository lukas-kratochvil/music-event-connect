import type { IEventSearchOptions } from "@music-event-connect/shared/api";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { endOfDay, format, isSameDay, startOfDay } from "date-fns";
import { Calendar as CalendarIcon, Filter, X } from "lucide-react";
import { useState } from "react";
import type { DateRange } from "react-day-picker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectGroup,
  MultiSelectItem,
  MultiSelectTrigger,
  MultiSelectValue,
} from "@/components/ui/multi-select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Spinner } from "@/components/ui/spinner";
import { fetchGenres, searchEvents } from "../services/mec/calls";
import EventCard from "./card/EventCard";

const PAGINATION_LIMIT = 20;

const EventsGrid = () => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [pickedStartDate, setPickedStartDate] = useState<DateRange>();
  const [pickedTempStartDate, setPickedTempStartDate] = useState<DateRange>();
  const startDateNow: DateRange = { from: new Date() };
  const [selectedTempGenres, setSelectedTempGenres] = useState<string[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [areActiveFiltersDisplayed, setAreActiveFiltersDisplayed] = useState(false);
  const { data: genres } = useQuery({
    queryKey: ["genres"] as const,
    queryFn: fetchGenres,
    select: (data) => data.toSorted((a, b) => a.name.localeCompare(b.name)),
    retry: false,
    staleTime: Infinity,
    gcTime: 0,
  });
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } = useInfiniteQuery({
    queryKey: ["events", { pickedStartDate, selectedGenres }] as const,
    initialPageParam: 0,
    queryFn: ({ pageParam }) => {
      const searchOptions = {
        filters: {
          startDateRange: pickedStartDate ?? startDateNow,
          genres: selectedGenres,
        },
        pagination: {
          limit: PAGINATION_LIMIT,
          offset: pageParam,
        },
        sorters: {
          startDate: { desc: false },
        },
      } satisfies IEventSearchOptions;
      return searchEvents(searchOptions);
    },
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length >= PAGINATION_LIMIT ? allPages.length * PAGINATION_LIMIT : undefined,
  });
  const allEvents = data?.pages.flat() ?? [];

  const onStartDatePickerSelect = (selectedDate: DateRange | undefined) => {
    if (!selectedDate) {
      setPickedTempStartDate(undefined);
      return;
    }

    if (selectedDate.from) {
      if (!selectedDate.to || isSameDay(selectedDate.to, selectedDate.from)) {
        setPickedTempStartDate({ from: startOfDay(selectedDate.from) });
      } else {
        setPickedTempStartDate({ from: startOfDay(selectedDate.from), to: endOfDay(selectedDate.to) });
      }
      return;
    }

    setPickedTempStartDate(undefined);
  };

  const handleSubmitFilters = (e: React.FormEvent) => {
    e.preventDefault();
    setPickedStartDate(pickedTempStartDate);
    setSelectedGenres(selectedTempGenres);
    setAreActiveFiltersDisplayed(true);
  };

  const handleClearFilters = () => {
    setAreActiveFiltersDisplayed(false);
    setPickedStartDate(undefined);
    setPickedTempStartDate(undefined);
    setSelectedGenres([]);
    setSelectedTempGenres([]);
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Upcoming events header */}
      <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Upcoming Events</h2>
          <p className="text-muted-foreground mt-2">Discover and book tickets for live music near you.</p>
        </div>
        <Button
          variant="outline"
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className="flex items-center gap-2 shrink-0"
        >
          <Filter className="h-4 w-4" />
          {isFilterOpen ? "Hide Filters" : "Filter"}
        </Button>
      </div>

      {/* Active filters */}
      {areActiveFiltersDisplayed && (
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {pickedStartDate?.from && (
            <Badge
              variant="secondary"
              className="flex items-center gap-1.5 pl-2.5 pr-0 py-1 text-sm font-normal border-gray-400"
            >
              <span>
                Start date: {format(pickedStartDate.from, "dd.MM.y")}
                {pickedStartDate.to && !isSameDay(pickedStartDate.from, pickedStartDate.to)
                  ? ` - ${format(pickedStartDate.to, "dd.MM.y")}`
                  : ""}
              </span>
              <Button
                title="Remove filter"
                variant="destructive"
                className="ml-1 rounded-full border-0 hover:bg-muted-foreground/20 transition-colors"
                onClick={() => {
                  setPickedStartDate(undefined);
                  setPickedTempStartDate(undefined);
                }}
              >
                <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
              </Button>
            </Badge>
          )}
          {selectedGenres.map((genre) => (
            <Badge
              key={"genre_" + genre}
              variant="secondary"
              className="flex items-center gap-1.5 pl-2.5 pr-0 py-1 text-sm font-normal border-gray-400"
            >
              <span>Genre: {genre}</span>
              <Button
                title="Remove filter"
                variant="destructive"
                className="ml-1 rounded-full border-0 hover:bg-muted-foreground/20 transition-colors"
                onClick={() => {
                  setSelectedGenres((prev) => prev.filter((genreName) => genreName !== genre));
                  setSelectedTempGenres((prev) => prev.filter((genreName) => genreName !== genre));
                }}
              >
                <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
              </Button>
            </Badge>
          ))}
        </div>
      )}

      {/* Filter inputs */}
      <form
        onSubmit={handleSubmitFilters}
        className={`grid transition-[grid-template-rows,opacity,margin] duration-300 ease-in-out ${
          isFilterOpen ? "grid-rows-[1fr] opacity-100 mb-6" : "grid-rows-[0fr] opacity-0 mb-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="flex flex-wrap items-center gap-4 p-5 border rounded-xl bg-card shadow-sm">
            <div className="flex flex-col gap-6">
              {/* Filter inputs */}
              <div className="flex gap-8">
                {/* Start date range picker */}
                <div className="flex flex-col gap-1.5 w-full sm:w-auto">
                  <Label htmlFor="start-date-picker">Start date</Label>
                  <div className="flex items-center gap-2 h-full">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          id="start-date-picker"
                          variant={"outline"}
                          className={"w-full sm:w-75 justify-start text-left font-normal"}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {pickedTempStartDate?.from ? (
                            pickedTempStartDate.to && !isSameDay(pickedTempStartDate.from, pickedTempStartDate.to) ? (
                              <>
                                {format(pickedTempStartDate.from, "dd.MM.y")} -{" "}
                                {format(pickedTempStartDate.to, "dd.MM.y")}
                              </>
                            ) : (
                              format(pickedTempStartDate.from, "dd.MM.y")
                            )
                          ) : (
                            <span className="text-muted-foreground">Pick a date range</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-auto p-0"
                        align="start"
                      >
                        <Calendar
                          mode="range"
                          defaultMonth={pickedTempStartDate?.from}
                          selected={pickedTempStartDate}
                          onSelect={onStartDatePickerSelect}
                          numberOfMonths={2}
                          disabled={{ before: new Date() }}
                        />
                      </PopoverContent>
                    </Popover>
                    <Button
                      title="Clear start date"
                      variant="destructive"
                      size="icon"
                      onClick={() => setPickedTempStartDate(undefined)}
                      disabled={pickedTempStartDate?.from === undefined}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {/* Genre multi-select */}
                <div className="flex flex-col gap-1.5 w-full sm:w-auto">
                  <Label htmlFor="start-date-picker">Genre</Label>
                  <div className="flex items-center gap-2 h-full">
                    <MultiSelect
                      values={selectedTempGenres}
                      onValuesChange={(values) => setSelectedTempGenres(values)}
                    >
                      <MultiSelectTrigger className="w-full max-w-100">
                        <MultiSelectValue
                          overflowBehavior="wrap-when-open"
                          placeholder="Select genres"
                        />
                      </MultiSelectTrigger>
                      <MultiSelectContent>
                        <MultiSelectGroup>
                          {genres?.map((genre) => (
                            <MultiSelectItem
                              key={genre.name}
                              value={genre.name}
                            >
                              {genre.name}
                            </MultiSelectItem>
                          ))}
                        </MultiSelectGroup>
                      </MultiSelectContent>
                    </MultiSelect>
                    <Button
                      title="Clear genres"
                      variant="destructive"
                      size="icon"
                      onClick={() => setSelectedTempGenres([])}
                      disabled={selectedTempGenres.length === 0}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit">Apply filters</Button>
                <Button
                  type="button"
                  onClick={handleClearFilters}
                  variant="destructive"
                >
                  Clear filters
                </Button>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Main content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center text-muted-foreground py-12 border-2 border-dashed rounded-xl">
          <Spinner className="h-10 w-10" />
          Events are loading...
        </div>
      ) : isError ? (
        <div className="py-12 text-center text-destructive border-2 border-dashed rounded-xl border-destructive/50">
          Something went wrong while loading events.
        </div>
      ) : (
        <div>
          {/* Events grid */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {allEvents.length > 0 ? (
              allEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                />
              ))
            ) : (
              <div className="col-span-full py-12 text-center text-muted-foreground border-2 border-dashed rounded-xl">
                No events found for the selected dates.
              </div>
            )}
          </div>

          {/* Load More Button */}
          {hasNextPage && (
            <div className="mt-10 flex justify-center">
              <Button
                variant="outline"
                size="lg"
                disabled={isFetchingNextPage}
                onClick={() => fetchNextPage()}
                className="min-w-50"
              >
                {isFetchingNextPage ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    Loading...
                  </>
                ) : (
                  "Show more events"
                )}
              </Button>
            </div>
          )}

          {!hasNextPage && allEvents.length > 0 && (
            <p className="mt-10 text-center text-sm text-muted-foreground">There are no more events.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default EventsGrid;
