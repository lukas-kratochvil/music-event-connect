import { Body, Controller, Get, HttpCode, Param, Post } from "@nestjs/common";
import { ApiBody, ApiNotFoundResponse, ApiOkResponse, ApiParam, ApiTags } from "@nestjs/swagger";
import { EventsSearchDTO } from "./dto/event-search.dto";
import { EventsService } from "./events.service";
import type { EventsFilters } from "./interfaces/search.interface";

@ApiTags("events")
@Controller("events")
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @ApiBody({ type: EventsSearchDTO, required: false, description: "Filtering of events." })
  @ApiOkResponse({ isArray: true, description: "Found events that satisfy specified filters." })
  @Post("search")
  @HttpCode(200)
  async searchEvents(@Body() body?: EventsSearchDTO) {
    if (!body) {
      return this.eventsService.findAll();
    }

    const { filters, sorters } = body;
    let searchFilters: EventsFilters | undefined = undefined;

    if (filters) {
      const { artistNames, startFrom, startTo } = filters;
      const startDateRange: EventsFilters["startDateRange"] =
        startFrom || startTo ? { from: startFrom, to: startTo } : undefined;
      searchFilters = {
        artistNames,
        startDateRange,
      };
    }

    return this.eventsService.findAll({
      filters: searchFilters,
      sorters,
    });
  }

  @ApiParam({ name: "id", required: true, description: "Event identifier." })
  @ApiOkResponse({ description: "Found event." })
  @ApiNotFoundResponse({ description: "Required event was not found." })
  @Get(":id")
  async findOne(@Param("id") id: string) {
    return this.eventsService.findOne(id);
  }
}
