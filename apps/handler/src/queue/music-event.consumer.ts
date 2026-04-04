import { areEntitiesSame, GRAPHS_MAP, plainToEntity, validateEntity } from "@music-event-connect/core";
import { MusicEventEntity, type EntityClassTransformOptions } from "@music-event-connect/core/entities";
import { MusicEventMapper } from "@music-event-connect/core/mappers";
import {
  MusicEventsQueue,
  type MusicEventsQueueDataType,
  type MusicEventsQueueNameType,
} from "@music-event-connect/core/queue";
import type { StrictOmit } from "@music-event-connect/shared";
import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import type { Job, Worker } from "bullmq";
import { LocationIQApiProxy } from "../geocoding/locationiq-api-proxy.service";

type Venue = MusicEventsQueueDataType["event"]["venues"][number];
type UpdatedVenue = StrictOmit<
  {
    [K in keyof Venue]: Venue[K] & {};
  },
  "address"
> & {
  address: Venue["address"] & {
    locality: NonNullable<Venue["address"]["locality"]>;
  };
};

@Processor(MusicEventsQueue.name)
export class MusicEventConsumer extends WorkerHost<Worker<MusicEventsQueueDataType, MusicEventsQueueDataType>> {
  #logger = new Logger(MusicEventConsumer.name);

  constructor(
    private readonly geocodingService: LocationIQApiProxy,
    private readonly musicEventMapper: MusicEventMapper
  ) {
    super();
  }

  /**
   * Processing steps:
   * 1) Transform to MusicEventEntity
   * 2) Validate MusicEventEntity
   * 3) Check if object already exists in the triple store
   *    1) If doesn't exist, continue with step 4)
   *    2) If exists, check if any property is updated
   *        1) If updated, continue with step 4)
   *        2) If not updated, return without further processing
   * 4) Serialize MusicEventEntity and store it in the triple store
   *    1) If step 3) determined that the object is new, perform an INSERT operation and update the Links graph
   *    2) If step 3) determined that the object is updated, perform a DELETE/INSERT operation
   *
   * Also, duplicate artists, venues, addresses in the database. Change in one event shouldn't influence other events.
   */
  override async process(job: Job<MusicEventsQueueDataType, MusicEventsQueueDataType, MusicEventsQueueNameType>) {
    try {
      // 1) Transform to MusicEventEntity
      const event = job.data.event;
      const venues = await this.#updateEventVenues(event.venues);
      const normalizeURL = (link: string) => {
        const url = new URL(link);
        return url.origin + url.pathname;
      };
      // IDs will be assigned by the transformation
      const eventWithIds = {
        ...event,
        url: normalizeURL(event.url),
        artists: event.artists.map((artist) => {
          const [homepages, onlineAccounts] = artist.webSites
            .map((webSite) => normalizeURL(webSite))
            .reduce<[string[], string[]]>(
              (acc, link) => {
                const isHomepage = new URL(link).pathname.split("/").filter(Boolean).at(-1) === undefined;

                if (isHomepage) {
                  acc[0].push(link);
                } else {
                  acc[1].push(link);
                }

                return acc;
              },
              [[], []]
            );
          return {
            ...artist,
            id: "",
            urls: homepages,
            accounts: onlineAccounts.map((link) => ({
              id: "",
              url: link,
              accountName: "",
              accountServiceHomepage: "",
            })),
          };
        }),
        ticket: {
          ...event.ticket,
          id: "",
          url: normalizeURL(event.ticket.url),
        },
        venues: venues.map((venue) => ({
          ...venue,
          id: "",
          address: {
            ...venue.address,
            id: "",
          },
        })),
      } satisfies MusicEventEntity;
      const musicEvent = plainToEntity(MusicEventEntity, eventWithIds, {
        excludeExtraneousValues: true,
        context: {
          origin: job.name,
        },
      } as EntityClassTransformOptions);

      // 2) Validate MusicEventEntity
      const validationErrors = await validateEntity(musicEvent);

      if (validationErrors.length > 0) {
        const validationErrorStr = validationErrors
          .map((error) => `Property ${error.property} ${JSON.stringify(error.value)}:\n` + error.toString())
          .join("\n");
        throw new Error(validationErrorStr);
      }

      // 3) Check if object already exists in the triple store
      const graphIri = GRAPHS_MAP.events[job.name];
      const doesExist = await this.musicEventMapper.exists(musicEvent.id, graphIri);

      if (!doesExist) {
        // 4) Create new MusicEventEntity and also create `sameAs` links in the Links graphs
        await this.musicEventMapper.create(musicEvent, graphIri);
        this.#logger.log("Entity created: " + musicEvent.id);
        return musicEvent;
      }

      // 3) Check if some properties are updated
      const originalEvent = await this.musicEventMapper.getWholeEntity(musicEvent.id, graphIri);

      if (areEntitiesSame(musicEvent, originalEvent)) {
        this.#logger.log("Entity unchanged: " + musicEvent.id);
        return originalEvent;
      }

      // 4) Update MusicEventEntity
      await this.musicEventMapper.update(originalEvent, musicEvent, graphIri);
      this.#logger.log("Entity updated: " + musicEvent.id);
      return musicEvent;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
      await job.log(errorMessage);
      this.#logger.error(
        `Error processing job ${job.id} [${job.data.event.url}]:\n` + errorMessage,
        error instanceof Error ? error.stack : undefined
      );
      throw error;
    }
  }

  async #updateEventVenues(venues: MusicEventsQueueDataType["event"]["venues"]): Promise<UpdatedVenue[]> {
    return Promise.all(
      venues.map(async (venue) => {
        const coords: Awaited<ReturnType<typeof this.geocodingService.geocodeForward>> =
          venue.latitude && venue.longitude
            ? { latitude: venue.latitude, longitude: venue.longitude }
            : await this.geocodingService.geocodeForward(venue.name, venue.address);
        const address: Awaited<ReturnType<typeof this.geocodingService.geocodeReverse>> = venue.address.locality
          ? { locality: venue.address.locality }
          : await this.geocodingService.geocodeReverse({
              latitude: coords.latitude,
              longitude: coords.longitude,
            });
        return {
          ...venue,
          latitude: coords.latitude,
          longitude: coords.longitude,
          address: {
            ...venue.address,
            locality: address.locality,
          },
        };
      })
    );
  }
}
