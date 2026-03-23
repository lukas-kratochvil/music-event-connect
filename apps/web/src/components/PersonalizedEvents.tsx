import { useQuery } from "@tanstack/react-query";
import { addMonths, startOfDay } from "date-fns";
import type { DateRange } from "react-day-picker";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Spinner } from "@/components/ui/spinner";
import { searchEvents } from "@/services/mec/calls";
import { spotifySDK } from "@/services/spotify/spotify-sdk";
import EventCard from "./card/EventCard";

const PersonalizedEvents = () => {
  const { data: artistNames, isLoading: artistNamesAreLoading } = useQuery({
    queryKey: ["spotify", "currentUser", "followedArtists"] as const,
    queryFn: async () => {
      const artists: Awaited<ReturnType<typeof spotifySDK.currentUser.followedArtists>>["artists"]["items"] = [];
      let afterCursor: string | undefined = undefined;
      let hasNextPage = true;

      while (hasNextPage) {
        const response = await spotifySDK.currentUser.followedArtists(afterCursor, 50);
        artists.push(...response.artists.items);

        if (response.artists.next) {
          const nextUrl = new URL(response.artists.next);
          afterCursor = nextUrl.searchParams.get("after") ?? undefined;
          if (!afterCursor) {
            hasNextPage = false;
          }
        } else {
          hasNextPage = false;
        }
      }

      return artists;
    },
    staleTime: 1000 * 60 * 60, // cache for 1 hour, because followed artists don't change often
    select: (data) => data.map((artist) => artist.name),
  });
  const startDateFrom = startOfDay(new Date());
  const startDate = {
    from: startDateFrom,
    to: addMonths(startDateFrom, 1),
  } as const satisfies DateRange;
  const {
    data: events,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["events", { artistNames, startDate }] as const,
    queryFn: () => searchEvents({ artistNames, startDate }),
    enabled: !!artistNames,
  });

  return (
    <div className="flex flex-col gap-2">
      {/* Personalized events header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight">Personalized Events</h2>
        <p className="text-muted-foreground mt-2">Events of your favorite artists in the upcoming month.</p>
      </div>

      {/* Events */}
      {isLoading || artistNamesAreLoading ? (
        <div className="flex flex-col items-center justify-center text-muted-foreground py-12 border-2 border-dashed rounded-xl">
          <Spinner className="h-10 w-10" />
          Personalized events are loading...
        </div>
      ) : isError || !events ? (
        <div className="py-12 text-center text-destructive border-2 border-dashed rounded-xl border-destructive/50">
          Something went wrong while loading personalized events.
        </div>
      ) : (
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
      )}
    </div>
  );
};

export default PersonalizedEvents;
