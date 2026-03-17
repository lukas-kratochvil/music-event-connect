export const RoutingPath = {
  EVENTS: "/events",
  OIDC_LOGIN: "/oidc-login",
} as const;

export type RoutingPath = (typeof RoutingPath)[keyof typeof RoutingPath];
