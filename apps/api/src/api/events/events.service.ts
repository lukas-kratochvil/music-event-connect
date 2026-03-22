import { Injectable, Logger } from "@nestjs/common";
import type { EventsFilters } from "./types/search.filter";

@Injectable()
export class EventsService {
  readonly #logger = new Logger(EventsService.name);

  async findAll(filters?: EventsFilters) {
    this.#logger.log(filters);
    return [];
  }

  async findOne(eventId: string) {
    this.#logger.log(eventId);
    return {};
  }
}
