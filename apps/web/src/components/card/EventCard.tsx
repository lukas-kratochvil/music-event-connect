import { format } from "date-fns";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { searchEvents } from "@/services/mec/calls";
import { RoutingPath } from "@/utils/routing-paths";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";

type EventCardProps = {
  event: Awaited<ReturnType<typeof searchEvents>>[number];
};

const EventCard = ({ event }: EventCardProps) => {
  const availableOffers = event.offers
    .filter((offer) => offer.availability === "InStock")
    .map((offer) => ({
      ...offer,
      origin: new URL(offer.url).hostname,
    }))
    .sort((a, b) => a.origin.localeCompare(b.origin));
  const allImages = [...(event.images ?? []), ...(event.artists?.map((artist) => artist.images ?? []).flat() ?? [])];
  return (
    <Card className="flex flex-col overflow-hidden transition-all hover:shadow-md">
      <Link to={RoutingPath.EVENTS + "/" + event.id}>
        <div className="aspect-video w-full overflow-hidden">
          <img
            className="h-full w-full object-cover transition-transform hover:scale-105"
            src={allImages.at(0)}
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
          <span className="text-muted-foreground">{format(event.startDate, "dd.MM.y H:mm")}</span>
        </div>
        <div>
          <span className="font-semibold text-foreground">Artists: </span>
          <span className="text-muted-foreground">{event.artists?.map((artist) => artist.name).join(", ") ?? ""}</span>
        </div>
        <div>
          <span className="font-semibold text-foreground">Venue: </span>
          {event.venues.map(({ name, address: { locality, country } }) => (
            <span
              key={name}
              className="text-muted-foreground"
            >
              {name} ({locality}, {country})
            </span>
          ))}
        </div>
      </CardContent>

      <CardFooter>
        {availableOffers.length === 0 ? (
          <Button
            className="w-full"
            disabled
          >
            Sold Out
          </Button>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="w-full">Tickets</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-56"
              align="end"
            >
              {availableOffers.map((offer) => (
                <DropdownMenuItem key={offer.url}>
                  <a
                    href={offer.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {offer.origin}
                  </a>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CardFooter>
    </Card>
  );
};

export default EventCard;
