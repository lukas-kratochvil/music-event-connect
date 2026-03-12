import { useQuery } from "@tanstack/react-query";
import { fetchEvents } from "../services/api-service";
import EventCard from "./EventCard";

const EventGrid = () => {
  const {
    data: events,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["events"],
    queryFn: fetchEvents,
  });

  if (isLoading) {
    return <div>Events are loading...</div>;
  }

  if (isError || !events) {
    return <div>Something went wrong while loading events.</div>;
  }

  return (
    <>
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight">Upcoming Events</h2>
        <p className="text-muted-foreground mt-2">Discover and book tickets for the best live music near you.</p>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {events.map((event) => (
          <EventCard
            key={event.id}
            event={event}
          />
        ))}
      </div>
    </>
  );
};

export default EventGrid;
