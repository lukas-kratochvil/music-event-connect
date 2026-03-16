export const RoutingPath = {
  MAIN: "/",
  EVENT_DETAIL: "/event",
} as const;

export type RoutingPath = (typeof RoutingPath)[keyof typeof RoutingPath];
