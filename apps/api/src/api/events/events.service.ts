import { getEntityOrigin, GRAPHS_MAP } from "@music-event-connect/core";
import { MusicEventMapper } from "@music-event-connect/core/mappers";
import type { IEventSearchOptions, IEventSearchPagination } from "@music-event-connect/shared/api";
import { Injectable } from "@nestjs/common";
import type { EventSearch } from "./entities/event-search.entity";
import type { Event } from "./entities/event.entity";

@Injectable()
export class EventsService {
  constructor(private readonly musicEventMapper: MusicEventMapper) {}

  async findAll(options?: IEventSearchOptions): Promise<EventSearch[]> {
    // apply default pagination (limit = 20 and offset = 0) if not passed by a caller
    const pagination =
      options?.pagination
      ?? ({
        limit: 20,
        offset: 0,
      } satisfies IEventSearchPagination);
    const events = await this.musicEventMapper.findAll(pagination, options?.filters, options?.sorters);
    return events.map((event) => ({
      id: event.id,
      name: event.name,
      startDate: event.startDate,
      images: event.images ?? [],
      artists: event.artists.map((artist) => ({
        name: artist.name,
      })),
      venues: event.venues.map((venue) => ({
        name: venue.name,
        address: {
          locality: venue.address.locality,
          country: venue.address.country,
        },
      })),
      offer: {
        url: event.ticket.url,
        availability: event.ticket.availability,
      },
    }));
  }

  async findOne(eventId: string): Promise<Event> {
    const eventOrigin = getEntityOrigin(eventId);

    if (!eventOrigin) {
      throw new Error("Invalid event ID");
    }

    const graphIri = GRAPHS_MAP["events"][eventOrigin];
    const event = await this.musicEventMapper.getWholeEntity(eventId, graphIri);
    return {
      id: event.id,
      name: event.name,
      doorTime: event.doorTime,
      startDate: event.startDate,
      endDate: event.endDate,
      images: event.images ?? [], // TODO: improve IMusicEvent so images can be also undefined? Check other props!
      artists: event.artists.map((artist) => ({
        name: artist.name,
        genres: artist.genres ?? [],
        images: artist.images ?? [],
        urls: artist.urls ?? [],
        accounts: artist.accounts
          ? artist.accounts.map((account) => ({
              url: account.url,
              name: account.accountName,
            }))
          : [],
      })),
      venues: event.venues.map((venue) => ({
        name: venue.name,
        latitude: venue.latitude,
        longitude: venue.longitude,
        address: {
          street: venue.address.street,
          locality: venue.address.locality,
          country: venue.address.country,
        },
      })),
      offer: {
        url: event.ticket.url,
        availability: event.ticket.availability,
      },
    } satisfies Event;
  }
}
