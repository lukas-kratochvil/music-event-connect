import type { MusicEventsQueueNameType } from "../queue/queue";

export const VALID_ENTITY_ID_PREFIXES = ["go", "tm", "tp"] as const;

type EntityIdPrefix = (typeof VALID_ENTITY_ID_PREFIXES)[number];

const ENTITY_ID_MAPPER = {
  goout: "go",
  ticketmaster: "tm",
  ticketportal: "tp",
} as const satisfies Record<MusicEventsQueueNameType, EntityIdPrefix>;

export const ENTITY_ID_DELIM = "-";

/**
 * Creates entity id.
 * @param origin the name of the site where this entity comes from
 * @param id custom identifier based on the site this entity comes from or its properties
 */
export const createEntityId = (origin: keyof typeof ENTITY_ID_MAPPER, id: string) =>
  `${ENTITY_ID_MAPPER[origin]}${ENTITY_ID_DELIM}${encodeURIComponent(id)}` as const;

export const isEntityId = (val: string): val is ReturnType<typeof createEntityId> =>
  VALID_ENTITY_ID_PREFIXES.some((prefix) => val.startsWith(prefix + ENTITY_ID_DELIM));
