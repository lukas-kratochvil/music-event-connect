import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { MapPin, Calendar, Clock, Globe, ExternalLink, Ticket } from "lucide-react";
import { useParams } from "react-router";
import { Map } from "@/components/map/Map";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Separator } from "@/components/ui/separator";
import { fetchEventDetail } from "@/services/mec/calls";

const EventDetailPage = () => {
  const { id } = useParams();
  const {
    data: event,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["events", id] as const,
    queryFn: () => {
      if (!id) {
        throw new Error("Event ID not provided!");
      }
      return fetchEventDetail(id);
    },
  });

  if (isLoading) {
    return <div>Event detail is loading...</div>;
  }

  if (isError || !event) {
    return <div>Something went wrong while loading the event detail.</div>;
  }

  const allImages = [
    ...event.images.map((img) => ({ type: "Event", imgUrl: img }) as const),
    ...event.artists.flatMap((artist) => artist.images.map((img) => ({ type: "Artist", imgUrl: img }) as const)),
  ];
  const venueHeader = event.venues.map((venue) => venue.name + " (" + venue.address.locality + ")").join(", ");
  const venueCoords = event.venues.map((venue) => ({
    text: venue.name,
    position: [venue.latitude, venue.longitude] as [number, number],
  }));

  return (
    <div className="container mx-auto px-4 py-8 md:px-8">
      {/* Event header */}
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">{event.name}</h1>
        <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            <span>{format(event.startDate, "EEEE, dd.MM.y")}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            <span className="w-fit">{venueHeader}</span>
          </div>
        </div>
      </div>

      {/* Images */}
      {allImages.length > 0 && (
        <div className="mb-10 px-12 w-full">
          <Carousel
            className="w-full"
            opts={{
              align: "start",
              dragFree: true, // for touch devices
            }}
          >
            <CarouselContent className="-ml-4">
              {allImages.map(({ type, imgUrl }) => (
                <CarouselItem
                  key={imgUrl}
                  className="pl-4 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4"
                >
                  <div className="aspect-square overflow-hidden rounded-xl border">
                    <img
                      className="h-full w-full object-cover"
                      src={imgUrl}
                      alt={type + " media"}
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>
      )}

      {/* TWO-COLUMN layout for content and tickets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative">
        {/* LEFT COLUMN: Event info */}
        <div className="lg:col-span-2 space-y-10">
          {/* Date and time details */}
          <section>
            <h2 className="text-2xl font-bold mb-4">Details</h2>
            <div className="flex flex-col gap-3 bg-card p-4 rounded-xl border">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <span className="font-semibold">Date:</span>
                <span>{format(event.startDate, "EEEE, dd.MM.y")}</span>
              </div>
              {event.doorTime && (
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  <span className="font-semibold">Doors:</span>
                  <span>{format(event.doorTime, "H:mm")}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                <span className="font-semibold">Starts:</span>
                <span>{format(event.startDate, "H:mm")}</span>
              </div>
              {event.endDate && (
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  <span className="font-semibold">Ends:</span>
                  <span>{format(event.endDate, "dd.MM.y (H:mm)")}</span>
                </div>
              )}
            </div>
          </section>

          <Separator />

          {/* Artists */}
          <section>
            <h2 className="text-2xl font-bold mb-6">Artists</h2>
            <div className="space-y-6">
              {event.artists.map((artist) => (
                <div
                  key={artist.name}
                  className="flex flex-col sm:flex-row gap-6 p-4 border rounded-xl bg-card"
                >
                  <div className="grow space-y-4">
                    <h3 className="text-xl font-bold">{artist.name}</h3>

                    {/* Genres */}
                    <div className="flex flex-wrap gap-2">
                      {artist.genres.map((g) => (
                        <Badge
                          key={g}
                          variant="secondary"
                        >
                          {g}
                        </Badge>
                      ))}
                    </div>

                    {/* Website and other third-party accounts */}
                    <div className="flex flex-wrap items-center gap-4 text-sm mt-4">
                      {artist.urls.map((url) => (
                        <a
                          key={url}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 hover:text-primary transition-colors"
                        >
                          <Globe className="h-4 w-4" />
                          <span>Official Site</span>
                        </a>
                      ))}
                      {artist.accounts.map((account) => (
                        <a
                          key={account.name}
                          href={account.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 hover:text-primary transition-colors"
                        >
                          <ExternalLink className="h-4 w-4" />
                          <span>{account.name}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <Separator />

          {/* Venues */}
          <section>
            <h2 className="text-2xl font-bold mb-6">{event.venues.length > 1 ? "Venues" : "Venue"}</h2>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {event.venues.map((venue) => (
                  // TODO: show the venue pin in the map on venue card hover
                  <div
                    key={venue.name}
                    className="flex flex-col p-5 border rounded-xl bg-card transition-shadow hover:shadow-md"
                  >
                    <div className="flex gap-2">
                      <MapPin className="h-5 w-5 text-primary shrink-0" />
                      <div className="min-w-0">
                        <h3
                          className="font-semibold truncate"
                          title={venue.name}
                        >
                          {venue.name}
                        </h3>
                        <p className="text-muted-foreground">
                          {`${venue.address.street ? venue.address.street + ", " : ""}`
                            + venue.address.locality
                            + ", "
                            + venue.address.country}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Map */}
              <div className="overflow-hidden rounded-xl border shadow-sm">
                <Map coords={venueCoords} />
              </div>
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN: Sticky tickets sidebar */}
        <div className="relative">
          <div className="sticky top-24">
            <Card className="border-primary/20 shadow-lg rounded-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ticket className="h-5 w-5" /> Tickets
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">Available tickets.</div>
              </CardContent>
              <CardFooter>
                {event.offer.availability === "SoldOut" ? (
                  <Button
                    className="w-full text-lg py-6"
                    disabled
                  >
                    Sold Out
                  </Button>
                ) : (
                  <Button
                    asChild
                    className="w-full text-lg py-6 shadow-md hover:shadow-lg transition-all"
                  >
                    <a
                      href={event.offer.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {/* TODO: extract the name of the portal offering the ticket */}
                      {event.offer.url}
                    </a>
                  </Button>
                )}
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetailPage;
