import { use } from "react";
import { fetchEventList } from "../services/api-service";
import EventItem from "./EventItem";

const EventList = () => {
  const events = use(fetchEventList());
  return (
    <>
      <div>Results found: {events.length}</div>
      {events.map((event) => (
        <EventItem
          key={event.ticketUrl}
          event={event}
        />
      ))}
    </>
  );
};

export default EventList;
