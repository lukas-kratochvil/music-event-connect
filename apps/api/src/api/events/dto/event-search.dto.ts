import { ApiPropertyOptional } from "@nestjs/swagger";

export class EventsSearchDTO {
  @ApiPropertyOptional({ type: "string", isArray: true, required: false })
  artistNames?: string[];

  @ApiPropertyOptional({ type: Date, required: false })
  startFrom?: Date;

  @ApiPropertyOptional({ type: Date, required: false })
  startTo?: Date;
}
