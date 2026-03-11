export const RoutingPath = {
  MAIN: "/",
  EVENT_DETAIL: "/music-event/:id",
} as const;

export type RoutingPath = (typeof RoutingPath)[keyof typeof RoutingPath];
