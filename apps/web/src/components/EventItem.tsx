import type { IAddress, IArtist, IMusicEvent, ITicket, IVenue } from "@music-event-connect/shared/interfaces";
import { format } from "date-fns";

export type EventListItem = Pick<IMusicEvent, "name" | "startDate" | "endDate"> & {
  ticketUrl: ITicket["url"];
  artists: IArtist["name"][];
  venues: {
    name: IVenue["name"];
    city: IAddress["locality"];
  }[];
};

type EventItemProps = {
  event: EventListItem;
};

const DATE_FORMAT = "d.M.y H:mm";

const EventItem = ({ event }: EventItemProps) => {
  let eventDate = "";

  if (event.endDate) {
    const dateStartFormat = event.startDate.getFullYear() === event.endDate.getFullYear() ? "d.M. H:mm" : DATE_FORMAT;
    eventDate = format(event.startDate, dateStartFormat) + " - " + format(event.endDate, DATE_FORMAT);
  } else {
    eventDate = format(event.startDate, DATE_FORMAT);
  }

  return (
    <>
      <div>
        <h2>{event.name}</h2>
        <div>Ticket image URL</div>
      </div>
      <div>
        <div>
          <div>Performers: {event.artists.join(", ")}</div>
          <div>Venue: {event.venues.map((v) => v.name).join(", ")}</div>
        </div>
        <div>
          <div>Date: {eventDate}</div>
          <div>City: {event.venues.map((v) => v.city).join(", ")}</div>
        </div>
      </div>
    </>
  );
};

export default EventItem;
