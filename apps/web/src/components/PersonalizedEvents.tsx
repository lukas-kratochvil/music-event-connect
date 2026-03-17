import { useQuery } from "@tanstack/react-query";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { fetchEvents } from "../services/api-service";
import EventCard from "./card/EventCard";

// TODO: delete
const artistNames = ["post-hudba, P/\\ST"];

const PersonalizedEvents = () => {
  const {
    data: events,
    isLoading,
    isError,
  } = useQuery({
    // TODO: modify queryKey to reflect the filter
    queryKey: ["events", { artistNames: artistNames }] as const,
    queryFn: () => fetchEvents(artistNames),
  });

  if (isLoading) {
    return <div>Personalized events are loading...</div>;
  }

  if (isError || !events) {
    return <div>Something went wrong while loading personalized events.</div>;
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight">Personalized Events</h2>
        <p className="text-muted-foreground mt-2">Events of your favorite artists in the upcoming month.</p>
      </div>
      <div className="px-12 w-full">
        <Carousel
          opts={{
            align: "start",
            dragFree: true, // for touch devices
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-4">
            {events.map((event) => (
              <CarouselItem
                key={event.id}
                className="pl-4 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5 flex"
              >
                <div className="w-full h-full">
                  <EventCard event={event} />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </div>
    </div>
  );
};

export default PersonalizedEvents;
