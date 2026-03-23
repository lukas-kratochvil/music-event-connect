import type { MusicEventMapper } from "@music-event-connect/core/mappers";
import { Injectable, Logger } from "@nestjs/common";
import type { EventsFilters, EventsSorter } from "./interfaces/search.interface";

@Injectable()
export class EventsService {
  readonly #logger = new Logger(EventsService.name);

  constructor(private readonly musicEventMapper: MusicEventMapper) {}

  async findAll(options?: { filters?: EventsFilters; sorters?: EventsSorter[] }) {
    this.#logger.log(filters);
    return [];
  }

  async findOne(eventId: string) {
    this.#logger.log(eventId);
    return {};
  }
}
