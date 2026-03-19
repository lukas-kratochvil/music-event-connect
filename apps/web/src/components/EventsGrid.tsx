import { useQuery } from "@tanstack/react-query";
import { format, isSameDay } from "date-fns";
import { Calendar as CalendarIcon, Filter, X } from "lucide-react";
import { useState } from "react";
import type { DateRange } from "react-day-picker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Spinner } from "@/components/ui/spinner";
import { fetchEvents } from "../services/api-service";
import EventCard from "./card/EventCard";

const EventsGrid = () => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [startDate, setStartDate] = useState<DateRange>();
  const [tempStartDate, setTempStartDate] = useState<DateRange>();

  const {
    data: events,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["events", { startDate }] as const,
    queryFn: () => fetchEvents({ startDate }),
  });

  const handleApplyFilters = () => {
    setStartDate(tempStartDate);
  };

  const handleClearFilters = () => {
    setStartDate(undefined);
    setTempStartDate(undefined);
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Upcoming events header */}
      <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Upcoming Events</h2>
          <p className="text-muted-foreground mt-2">Discover and book tickets for the best live music near you.</p>
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
      {startDate?.from && (
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          <Badge
            variant="secondary"
            className="flex items-center gap-1.5 pl-2.5 pr-0 py-1 text-sm font-normal border-gray-400"
          >
            <span>
              Start date: {format(startDate.from, "dd.MM.y")}
              {startDate.to && !isSameDay(startDate.from, startDate.to) ? ` - ${format(startDate.to, "dd.MM.y")}` : ""}
            </span>
            <Button
              title="Remove filter"
              variant="destructive"
              className="ml-1 rounded-full border-0 hover:bg-muted-foreground/20 transition-colors"
              onClick={() => {
                setStartDate(undefined);
                setTempStartDate(undefined);
              }}
            >
              <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
            </Button>
          </Badge>
        </div>
      )}

      {/* Filter inputs */}
      <div
        className={`grid transition-[grid-template-rows,opacity,margin] duration-300 ease-in-out ${
          isFilterOpen ? "grid-rows-[1fr] opacity-100 mb-6" : "grid-rows-[0fr] opacity-0 mb-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="flex flex-wrap items-center gap-4 p-5 border rounded-xl bg-card shadow-sm">
            <div className="flex flex-col gap-6">
              {/* Start date range picker */}
              <div className="flex flex-col gap-1.5 w-full sm:w-auto">
                <Label htmlFor="start-date-picker">Start date</Label>
                <div className="flex items-center gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="start-date-picker"
                        variant={"outline"}
                        className={"w-full sm:w-75 justify-start text-left font-normal"}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {tempStartDate?.from ? (
                          tempStartDate.to && !isSameDay(tempStartDate.from, tempStartDate.to) ? (
                            <>
                              {format(tempStartDate.from, "dd.MM.y")} - {format(tempStartDate.to, "dd.MM.y")}
                            </>
                          ) : (
                            format(tempStartDate.from, "dd.MM.y")
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
                        defaultMonth={tempStartDate?.from}
                        selected={tempStartDate}
                        onSelect={setTempStartDate}
                        numberOfMonths={2}
                      />
                    </PopoverContent>
                  </Popover>
                  {tempStartDate?.from && (
                    <Button
                      title="Clear start date"
                      variant="destructive"
                      size="icon"
                      onClick={() => setTempStartDate(undefined)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleApplyFilters}>Apply filters</Button>
                <Button
                  variant="destructive"
                  onClick={handleClearFilters}
                >
                  Clear filters
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Events grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center text-muted-foreground py-12 border-2 border-dashed rounded-xl">
          <Spinner className="h-10 w-10" />
          Events are loading...
        </div>
      ) : isError || !events ? (
        <div className="py-12 text-center text-destructive border-2 border-dashed rounded-xl border-destructive/50">
          Something went wrong while loading events.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {events.length > 0 ? (
            events.map((event) => (
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
      )}
      {/* TODO: implement Pagination: https://ui.shadcn.com/docs/components/radix/pagination */}
    </div>
  );
};

export default EventsGrid;
