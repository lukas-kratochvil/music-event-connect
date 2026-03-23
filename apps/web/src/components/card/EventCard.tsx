import { format } from "date-fns";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { searchEvents } from "@/services/mec/calls";
import { RoutingPath } from "@/utils/routing-paths";

type EventCardProps = {
  event: Awaited<ReturnType<typeof searchEvents>>[number];
};

const EventCard = ({ event }: EventCardProps) => {
  // TODO: show multiple offers or choose only one that is available?
  const offer = event.offers[0]!;
  return (
    <Card className="flex flex-col overflow-hidden transition-all hover:shadow-md">
      <Link to={RoutingPath.EVENTS + "/" + event.id}>
        <div className="aspect-video w-full overflow-hidden">
          <img
            className="h-full w-full object-cover transition-transform hover:scale-105"
            src={event.images.at(0)}
            alt={event.name}
          />
        </div>
      </Link>

      <CardHeader>
        <Link
          className="hover:text-blue-400"
          to={RoutingPath.EVENTS + "/" + event.id}
        >
          <CardTitle className="line-clamp-1">{event.name}</CardTitle>
        </Link>
      </CardHeader>

      <CardContent className="grow space-y-2 text-sm">
        <div>
          <span className="font-semibold text-foreground">Date: </span>
          <span className="text-muted-foreground">{format(event.startDate, "dd.MM.y HH:mm")}</span>
        </div>
        <div>
          <span className="font-semibold text-foreground">Performers: </span>
          <span className="text-muted-foreground">{event.artists.map((artist) => artist.name).join(", ")}</span>
        </div>
        <div>
          <span className="font-semibold text-foreground">Location: </span>
          {event.venues.map(({ name, address: { locality } }) => (
            <span
              key={name}
              className="text-muted-foreground"
            >
              {name} ({locality})
            </span>
          ))}
        </div>
      </CardContent>

      <CardFooter>
        {offer.availability === "SoldOut" ? (
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
              href={offer.url}
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
