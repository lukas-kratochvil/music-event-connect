import { Body, Controller, Get, HttpCode, Param, Post } from "@nestjs/common";
import { EventSearchDTO } from "./dto/event-search.dto";
import { EventsService, type EventsFilters } from "./events.service";

@Controller("events")
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post("search")
  @HttpCode(200)
  async searchEvents(@Body() body: EventSearchDTO) {
    const { artistNames, startFrom, startTo } = body;
    const startDateRange: EventsFilters["startDateRange"] =
      startFrom || startTo ? { from: startFrom, to: startTo } : undefined;
    return this.eventsService.findAll({
      artistNames,
      startDateRange,
    });
  }

  @Get(":id")
  async findOne(@Param("id") id: string) {
    return this.eventsService.findOne(id);
  }
}
