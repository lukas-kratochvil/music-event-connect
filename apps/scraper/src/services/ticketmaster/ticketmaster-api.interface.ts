import type { TicketmasterEventsData, TicketmasterEventsResponse } from "./ticketmaster-api.types";

export interface ITicketmasterApi {
  /**
   * Get music events.
   * @param page Behaves like an offset, contains 20 items per page.
   */
  getMusicEvents(page: number): Promise<Extract<TicketmasterEventsResponse, TicketmasterEventsData>>;
}
