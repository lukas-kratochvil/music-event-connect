import type { MusicEventMapper } from "@music-event-connect/core/mappers";
import { Injectable, Logger } from "@nestjs/common";
import type { SearchEventsOptions } from "./interfaces/search.interface";

@Injectable()
export class EventsService {
  readonly #logger = new Logger(EventsService.name);

  constructor(private readonly musicEventMapper: MusicEventMapper) {}

  async findAll(options?: SearchEventsOptions) {
    if (!options) {
      // apply default pagination (limit = 20 and offset = 0)
      return events;
    }
    this.#logger.log(filters);
    return [];
  }

  async findOne(eventId: string) {
    this.#logger.log(eventId);
    return {};
  }
}
