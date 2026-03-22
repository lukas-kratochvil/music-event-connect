import { Injectable, Logger } from "@nestjs/common";

export type DateRange = {
  from: Date | undefined;
  to: Date | undefined;
};

export type EventsFilters = {
  artistNames?: string[];
  startDateRange?: DateRange;
};

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
