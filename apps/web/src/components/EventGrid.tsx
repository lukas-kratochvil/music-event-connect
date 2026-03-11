import { use } from "react";
import { fetchEvents } from "../services/api-service";
import EventCard from "./EventCard";

const EventGrid = () => {
  const events = use(fetchEvents());
  return (
    <>
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight">Upcoming Events</h2>
        <p className="text-muted-foreground mt-2">Discover and book tickets for the best live music near you.</p>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {events.map((event) => (
          <EventCard
            key={event.ticketUrl}
            event={event}
          />
        ))}
      </div>
    </>
  );
};

export default EventGrid;
