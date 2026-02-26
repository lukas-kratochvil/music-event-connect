import type { MusicEventsQueueNameType } from "../queue/queue";

type MusicEventIdPrefix = "go" | "tm" | "tp";

const MUSIC_EVENT_ID_MAPPER = {
  goout: "go",
  ticketmaster: "tm",
  ticketportal: "tp",
} as const satisfies Record<MusicEventsQueueNameType, MusicEventIdPrefix>;

export const VALID_MUSIC_EVENT_ID_PREFIXES = Object.values(MUSIC_EVENT_ID_MAPPER);

export const MUSIC_EVENT_ID_DELIM = "-";

/**
 * Creates music event id.
 * @param origin the name of the site where this music event comes from
 * @param id event id specific to the site
 */
export const createMusicEventId = (origin: keyof typeof MUSIC_EVENT_ID_MAPPER, id: string) =>
  `${MUSIC_EVENT_ID_MAPPER[origin]}${MUSIC_EVENT_ID_DELIM}${encodeURIComponent(id)}` as const;

