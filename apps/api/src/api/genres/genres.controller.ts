import { Controller, Get } from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { Genre } from "./entities/genre.entity";
import { GenresService } from "./genres.service";

@ApiTags("genres")
@Controller("genres")
export class GenresController {
  constructor(private readonly genresService: GenresService) {}

  @ApiOkResponse({
    type: () => Genre,
    isArray: true,
    description: "Found genres.",
  })
  @Get()
  async findAll(): Promise<Genre[]> {
    return this.genresService.findAll();
  }
}
