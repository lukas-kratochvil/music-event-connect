import { Body, Controller, Get, HttpCode, Param, Post } from "@nestjs/common";
import { ApiBody, ApiNotFoundResponse, ApiOkResponse, ApiParam, ApiTags } from "@nestjs/swagger";
import { EventsSearchOptions } from "./dto/event-search.dto";
import { EventSearch } from "./entities/event-search.entity";
import { Event } from "./entities/event.entity";
import { EventsService } from "./events.service";

@ApiTags("events")
@Controller("events")
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @ApiBody({ type: () => EventsSearchOptions, description: "Filtering of events." })
  @ApiOkResponse({
    type: () => EventSearch,
    isArray: true,
    description: "Found events that satisfy specified filters.",
  })
  @Post("search")
  @HttpCode(200)
  async searchEvents(@Body() searchOptions: EventsSearchOptions): Promise<EventSearch[]> {
    return this.eventsService.findAll(searchOptions);
  }

  @ApiParam({ name: "id", required: true, description: "Event identifier." })
  @ApiOkResponse({ type: () => Event, description: "Found event." })
  @ApiNotFoundResponse({ description: "Required event was not found." })
  @Get(":id")
  async findOne(@Param("id") id: string): Promise<Event> {
    return this.eventsService.findOne(id);
  }
}
