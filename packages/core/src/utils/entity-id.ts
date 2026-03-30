import type { MusicEventsQueueNameType } from "../queue/queue";

const VALID_ENTITY_ID_PREFIXES = ["go", "tm", "tp"] as const;

type EntityIdPrefix = (typeof VALID_ENTITY_ID_PREFIXES)[number];

const ENTITY_ORIGIN_TO_PREFIX_MAPPER = {
  goout: "go",
  ticketmaster: "tm",
  ticketportal: "tp",
} as const satisfies Record<MusicEventsQueueNameType, EntityIdPrefix>;

const ENTITY_PREFIX_TO_ORIGIN_MAPPER = {
  go: "goout",
  tm: "ticketmaster",
  tp: "ticketportal",
} as const satisfies Record<
  (typeof ENTITY_ORIGIN_TO_PREFIX_MAPPER)[keyof typeof ENTITY_ORIGIN_TO_PREFIX_MAPPER],
  keyof typeof ENTITY_ORIGIN_TO_PREFIX_MAPPER
>;

const ENTITY_ID_DELIM = "-";

/**
 * Creates entity id.
 * @param origin the name of the site where this entity comes from
 * @param id custom identifier based on the site this entity comes from or its properties
 */
export const createEntityId = (origin: keyof typeof ENTITY_ORIGIN_TO_PREFIX_MAPPER, id: string) =>
  `${ENTITY_ORIGIN_TO_PREFIX_MAPPER[origin]}${ENTITY_ID_DELIM}${encodeURIComponent(id)}` as const;

/**
 * Checks if the `val` was created by the `createEntityId()`.
 */
export const isEntityId = (val: string): val is ReturnType<typeof createEntityId> =>
  VALID_ENTITY_ID_PREFIXES.some((prefix) => {
    const fullPrefix = prefix + ENTITY_ID_DELIM;
    return val.startsWith(fullPrefix) && val.length > fullPrefix.length;
  });

/**
 * Gets entity id prefix.
 * @param id entity id created by the `createEntityId()`
 */
const getEntityIdPrefix = (id: string) => (isEntityId(id) ? (id.split(ENTITY_ID_DELIM)[0]! as EntityIdPrefix) : null);

/**
 * Gets the origin of the entity with the specified `id`.
 * @param id id of the entity
 */
export const getEntityOrigin = (id: string) => {
  const prefix = getEntityIdPrefix(id);
  return prefix ? ENTITY_PREFIX_TO_ORIGIN_MAPPER[prefix] : null;
};
