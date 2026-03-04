import type { MusicEventsQueueNameType } from "../queue";

type EventGraphs = {
  [EventSourceName in MusicEventsQueueNameType]: `http://music-event-connect.cz/events/${EventSourceName}`;
};

export const GRAPHS_MAP = {
  events: {
    goout: "http://music-event-connect.cz/events/goout",
    ticketmaster: "http://music-event-connect.cz/events/ticketmaster",
    ticketportal: "http://music-event-connect.cz/events/ticketportal",
  } satisfies EventGraphs,
  links: "http://music-event-connect.cz/links",
  musicBrainz: "http://music-event-connect.cz/musicbrainz",
  osm: {
    cze: "http://music-event-connect.cz/osm/cze",
  },
} as const;

export const MUSIC_EVENT_GRAPHS = [
  GRAPHS_MAP.events.goout,
  GRAPHS_MAP.events.ticketmaster,
  GRAPHS_MAP.events.ticketportal,
] as const;

export const LINKED_GRAPHS = [...MUSIC_EVENT_GRAPHS, GRAPHS_MAP.musicBrainz] as const;

export type MusicEventGraph = (typeof MUSIC_EVENT_GRAPHS)[number];
