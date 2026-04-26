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
   * 1) transform received data into MusicEventEntity class instance
   * 2) validate MusicEventEntity instance
   * 3) check if the music event already exists in the RDF store
   *    1) if it doesn't exist, continue with step 4)
   *    2) if it exists, check if any property has been updated
   *        1) if properties are updated, continue with step 4)
   *        2) if properties aren't updated, return without further processing
   * 4) serialize MusicEventEntity and store it in the triple store
   *    1) if step 3) determined that the music event is new, perform an INSERT operation and update the Links graph
   *    2) if step 3) determined that the music event is updated, perform a DELETE/INSERT operation and update the Links graph
   */
  override async process(job: Job<MusicEventsQueueDataType, MusicEventsQueueDataType, MusicEventsQueueNameType>) {
    try {
      // 1) transform received data into MusicEventEntity class instance
      const musicEvent = await this.transformToEntity(job);

      // 2) validate MusicEventEntity instance
      const validationErrors = await validateEntity(musicEvent);

      if (validationErrors.length > 0) {
        const validationErrorStr = validationErrors
          .map((error) => `Property ${error.property} ${JSON.stringify(error.value)}:\n` + error.toString())
          .join("\n");
        throw new Error(validationErrorStr);
      }

      // 3) check if the music event already exists in the RDF store
      const graphIri = GRAPHS_MAP.events[job.name];
      const isPresent = await this.musicEventMapper.exists(musicEvent.id, graphIri);

      if (!isPresent) {
        // 4) create new MusicEventEntity and also create `sameAs` links in the Links graphs
        await this.musicEventMapper.create(musicEvent, graphIri);
        this.#logger.log("Entity created: " + musicEvent.id);
        return musicEvent;
      }

      // 3) check if any property has been updated
      const originalEvent = await this.musicEventMapper.getWholeEntity(musicEvent.id, graphIri);

      if (areEntitiesSame(musicEvent, originalEvent)) {
        this.#logger.log("Entity unchanged: " + musicEvent.id);
        return originalEvent;
      }

      // 4) update MusicEventEntity and also update `sameAs` links in the Links graphs
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

  async transformToEntity(
    job: Job<MusicEventsQueueDataType, MusicEventsQueueDataType, MusicEventsQueueNameType>
  ): Promise<MusicEventEntity> {
    const event = await this.#addMissingEventData(job.data.event);

    // plain object must have the same structure as the MusicEventEntity, otherwise missing properties won't be created by the `plainToEntity()` function
    // IDs will be assigned by the transformation
    const normalizeURL = (link: string) => {
      const url = new URL(link);
      return url.origin + url.pathname;
    };
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
      venues: event.venues.map((venue) => ({
        ...venue,
        id: "",
        address: {
          ...venue.address,
          id: "",
        },
      })),
    } satisfies MusicEventEntity;

    return plainToEntity(MusicEventEntity, eventWithIds, {
      excludeExtraneousValues: true,
      context: {
        origin: job.name,
      },
    } as EntityClassTransformOptions);
  }

  async #addMissingEventData(event: MusicEventsQueueDataType["event"]) {
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
    const venues = await Promise.all(
      event.venues.map(async (venue): Promise<UpdatedVenue> => {
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
    return { ...event, venues };
  }
}
