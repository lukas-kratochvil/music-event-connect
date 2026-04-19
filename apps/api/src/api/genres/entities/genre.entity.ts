import type { IGenre } from "@music-event-connect/shared/api";
import { ApiProperty } from "@nestjs/swagger";

export class Genre implements IGenre {
  @ApiProperty()
  name: string;
}
