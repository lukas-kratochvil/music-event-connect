export const RoutingPath = {
  EVENTS: "/events",
} as const;

export type RoutingPath = (typeof RoutingPath)[keyof typeof RoutingPath];
