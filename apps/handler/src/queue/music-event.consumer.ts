import {
  areEntitiesSame,
  createMusicEventId,
  getMusicEventGraphIRI,
  plainToEntity,
  validateEntity,
} from "@music-event-connect/core";
import { MusicEventEntity } from "@music-event-connect/core/entities";
import { MusicEventMapper } from "@music-event-connect/core/mappers";
import {
  MusicEventsQueue,
  type MusicEventsQueueDataType,
  type MusicEventsQueueNameType,
} from "@music-event-connect/core/queue";
import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import type { Job, Worker } from "bullmq";
import { LocationIQApiProxy } from "../geocoding/locationiq-api-proxy.service";

type Venue = MusicEventsQueueDataType["event"]["venues"][number];
type VenueWithCoordinates = {
  [K in keyof Venue]: Venue[K] & {};
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
   *    1) If step 3) determined that the object is new, perform an INSERT operation
   *    2) If step 3) determined that the object is updated, perform a DELETE/INSERT operation
   *
   * Also, duplicate artists, venues, addresses in the database. Change in one event shouldn't influence other events.
   */
  override async process(job: Job<MusicEventsQueueDataType, MusicEventsQueueDataType, MusicEventsQueueNameType>) {
    try {
      // 1) Transform to MusicEventEntity
      const event = job.data.event;
      const eventId = createMusicEventId(job.name, event.id);
      const venuesWithCoords = await this.#getEventVenuesWithCoordinates(event.venues);
      // IDs will be assigned by the transformation
      const eventWithIds = {
        ...event,
        id: eventId,
        artists: event.artists.map((artist) => {
          const [homepages, onlineAccounts] = artist.webSites.reduce<[string[], string[]]>(
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
            url: homepages,
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
        },
        venues: venuesWithCoords.map((venue) => ({
          ...venue,
          id: "",
          address: {
            ...venue.address,
            id: "",
          },
        })),
      } satisfies MusicEventEntity;
      const musicEvent = plainToEntity(MusicEventEntity, eventWithIds, { excludeExtraneousValues: true });

      // 2) Validate MusicEventEntity
      const validationErrors = await validateEntity(musicEvent);

      if (validationErrors.length > 0) {
        const validationErrorStr = validationErrors
          .map((error) => `Property ${error.property} ${JSON.stringify(error.value)}:\n` + error.toString())
          .join("\n");
        throw new Error(validationErrorStr);
      }

      // 3) Check if object already exists in the triple store
      const graphIri = getMusicEventGraphIRI(job.name);
      const doesExist = await this.musicEventMapper.exists(musicEvent.id, graphIri);

      if (!doesExist) {
        // 4) Create new MusicEventEntity
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

  async #getEventVenuesWithCoordinates(
    venues: MusicEventsQueueDataType["event"]["venues"]
  ): Promise<VenueWithCoordinates[]> {
    const isVenueWithCoords = (venue: (typeof venues)[number]): venue is VenueWithCoordinates =>
      venue.latitude !== undefined && venue.longitude !== undefined;

    if (venues.every(isVenueWithCoords)) {
      return venues;
    }

    return Promise.all(
      venues.map(async (venue) => {
        if (isVenueWithCoords(venue)) {
          return venue;
        }

        const coords = await this.geocodingService.search(venue.name, venue.address);
        return {
          ...venue,
          latitude: coords.latitude,
          longitude: coords.longitude,
        };
      })
    );
  }
}
