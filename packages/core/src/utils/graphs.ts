import type { MusicEventsQueueNameType } from "../queue";

export const ALL_GRAPHS_MAP = {
  events: {
    goout: "http://music-event-connect.cz/events/goout",
    ticketmaster: "http://music-event-connect.cz/events/ticketmaster",
    ticketportal: "http://music-event-connect.cz/events/ticketportal",
  } satisfies {
    [EventSourceName in MusicEventsQueueNameType]: `http://music-event-connect.cz/events/${EventSourceName}`;
  },
  links: "http://music-event-connect.cz/links",
} as const;

export const MUSIC_EVENT_GRAPHS = [
  ALL_GRAPHS_MAP.events.goout,
  ALL_GRAPHS_MAP.events.ticketmaster,
  ALL_GRAPHS_MAP.events.ticketportal,
] as const;
