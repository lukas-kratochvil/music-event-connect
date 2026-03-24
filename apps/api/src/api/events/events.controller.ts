import { Body, Controller, Get, HttpCode, Param, Post } from "@nestjs/common";
import { ApiBody, ApiNotFoundResponse, ApiOkResponse, ApiParam, ApiTags } from "@nestjs/swagger";
import { EventsSearchDTO } from "./dto/event-search.dto";
import { EventSearch } from "./entities/event-search.entity";
import { Event } from "./entities/event.entity";
import { EventsService } from "./events.service";
import type { SearchEventsOptions } from "./interfaces/search.interface";

@ApiTags("events")
@Controller("events")
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @ApiBody({ type: () => EventsSearchDTO, required: false, description: "Filtering of events." })
  @ApiOkResponse({
    type: () => EventSearch,
    isArray: true,
    description: "Found events that satisfy specified filters.",
  })
  @Post("search")
  @HttpCode(200)
  async searchEvents(@Body() body?: EventsSearchDTO): Promise<EventSearch[]> {
    if (!body) {
      return this.eventsService.findAll();
    }

    const { pagination, filters, sorters } = body;
    let searchFilters: SearchEventsOptions["filters"] = undefined;

    if (filters) {
      const { artistNames, startFrom, startTo } = filters;
      const startDateRange: NonNullable<SearchEventsOptions["filters"]>["startDateRange"] =
        startFrom || startTo ? { from: startFrom, to: startTo } : undefined;
      searchFilters = {
        artistNames,
        startDateRange,
      };
    }

    return this.eventsService.findAll({
      pagination,
      filters: searchFilters,
      sorters,
    });
  }

  @ApiParam({ name: "id", required: true, description: "Event identifier." })
  @ApiOkResponse({ type: () => Event, description: "Found event." })
  @ApiNotFoundResponse({ description: "Required event was not found." })
  @Get(":id")
  async findOne(@Param("id") id: string): Promise<Event> {
    return this.eventsService.findOne(id);
  }
}
