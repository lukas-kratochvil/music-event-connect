import type { MusicEventsQueueNameType } from "../queue/queue";

export const VALID_MUSIC_EVENT_ID_PREFIXES = ["go", "tm", "tp"] as const;

type MusicEventIdPrefix = (typeof VALID_MUSIC_EVENT_ID_PREFIXES)[number];

const MUSIC_EVENT_ID_MAPPER = {
  goout: "go",
  ticketmaster: "tm",
  ticketportal: "tp",
} as const satisfies Record<MusicEventsQueueNameType, MusicEventIdPrefix>;

export const MUSIC_EVENT_ID_DELIM = "-";

/**
 * Creates music event id.
 * @param origin the name of the site where this music event comes from
 * @param id event id specific to the site
 */
export const createMusicEventId = (origin: keyof typeof MUSIC_EVENT_ID_MAPPER, id: string) =>
  `${MUSIC_EVENT_ID_MAPPER[origin]}${MUSIC_EVENT_ID_DELIM}${encodeURIComponent(id)}` as const;

/**
 * Gets music event id prefix.
 * @param id event id created by the `createMusicEventId()`
 */
export const getMusicEventIdPrefix = (id: string) => id.split(MUSIC_EVENT_ID_DELIM)[0]! as MusicEventIdPrefix;
