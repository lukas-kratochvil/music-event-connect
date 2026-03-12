import { format, isSameDay } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { fetchEvents } from "@/services/api-service";

const DATE_FORMAT = "d.M.y H:mm";

const getEventDate = (event: { startDate: Date; endDate?: Date }) => {
  if (!event.endDate) {
    return format(event.startDate, DATE_FORMAT);
  }
  if (isSameDay(event.endDate, event.startDate)) {
    return format(event.startDate, DATE_FORMAT) + " - " + format(event.endDate, "H:mm");
  }
  const dateStartFormat = event.startDate.getFullYear() === event.endDate.getFullYear() ? "d.M. H:mm" : DATE_FORMAT;
  return format(event.startDate, dateStartFormat) + " - " + format(event.endDate, DATE_FORMAT);
};

type EventCardProps = {
  event: Awaited<ReturnType<typeof fetchEvents>>[number];
};

const EventCard = ({ event }: EventCardProps) => {
  const eventDate = getEventDate(event);
  return (
    <Card className="flex flex-col overflow-hidden transition-all hover:shadow-md">
      <div className="aspect-video w-full overflow-hidden">
        <img
          src={event.images.at(0)}
          alt={event.name}
          className="h-full w-full object-cover transition-transform hover:scale-105"
        />
      </div>

      <CardHeader>
        <CardTitle className="line-clamp-1">{event.name}</CardTitle>
        <CardDescription className="text-primary font-medium">{eventDate}</CardDescription>
      </CardHeader>

      <CardContent className="grow space-y-2 text-sm">
        <div>
          <span className="font-semibold text-foreground">Performers: </span>
          <span className="text-muted-foreground">{event.artists.join(", ")}</span>
        </div>
        <div>
          <span className="font-semibold text-foreground">Location: </span>
          {event.venues.map(({ name, city }) => (
            <span
              key={name}
              className="text-muted-foreground"
            >
              {name} ({city})
            </span>
          ))}
        </div>
      </CardContent>

      <CardFooter>
        {event.isSoldOut ? (
          <Button
            className="w-full"
            disabled
          >
            Sold Out
          </Button>
        ) : (
          <Button
            asChild
            className="w-full"
          >
            <a
              href={event.ticketUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Tickets
            </a>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default EventCard;
