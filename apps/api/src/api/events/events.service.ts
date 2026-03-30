import { getEntityOrigin, GRAPHS_MAP } from "@music-event-connect/core";
import { MusicEventMapper } from "@music-event-connect/core/mappers";
import type { IEventSearchOptions } from "@music-event-connect/shared/api";
import { Injectable } from "@nestjs/common";
// import { compareAsc, endOfDay, startOfDay } from "date-fns";
import type { EventSearch } from "./entities/event-search.entity";
import type { Event } from "./entities/event.entity";

const baseEvents = [
  {
    id: "tm-1",
    name: "P/\\ST + Hentai Corporation + SEBE",
    offers: [
      {
        url: "https://ticketmaster.cz/dummy-event/buy",
        availability: "SoldOut",
      },
    ],
    startDate: new Date("2026-03-11T19:00:00Z"),
    artists: [{ name: "P/\\ST" }, { name: "Hentai Corporation" }, { name: "SEBE" }],
    venues: [
      {
        name: "Lucerna Music Bar",
        address: {
          locality: "Prague",
          country: "CZ",
        },
      },
    ],
    images: ["https://goout.net/cdn-cgi/image/format=auto,width=383/i/137/1376340-383.jpg"],
  },
  {
    id: "go-32",
    name: "Vinyla Night: Gufrau + post-hudba + matyášovi kamarádi + Miss Petty + Rivermoans + teige + další",
    offers: [
      {
        url: "https://goout.net/cs/listky/vinyla-night-gufrau+post-hudba+matyasovi-kamaradi+miss-petty+/rvhjb/",
        availability: "InStock",
      },
    ],
    startDate: new Date("2026-04-13T19:00:00Z"),
    artists: [
      { name: "post-hudba" },
      { name: "Gufrau" },
      { name: "matyášovi kamarádi" },
      { name: "teige" },
      { name: "Rivermoans" },
      { name: "Miss Petty" },
    ],
    venues: [
      {
        name: "Roxy Prague",
        address: {
          locality: "Prague",
          country: "CZ",
        },
      },
    ],
    images: ["https://goout.net/cdn-cgi/image/format=auto,width=383/i/133/1332707-383.jpg"],
  },
] as const satisfies EventSearch[];

const events = [...baseEvents, ...baseEvents, ...baseEvents].map((event, i) => ({
  ...event,
  id: event.id + i,
}));

@Injectable()
export class EventsService {
  // readonly #logger = new Logger(EventsService.name);

  constructor(private readonly musicEventMapper: MusicEventMapper) {}

  async findAll(options?: IEventSearchOptions): Promise<EventSearch[]> {
    if (!options) {
      // apply default pagination (limit = 20 and offset = 0)
      return events;
    }

    return events;
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
