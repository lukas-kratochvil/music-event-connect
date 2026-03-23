import { IsDateMoreInFutureThan } from "@music-event-connect/core/validation";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { ArrayUnique, IsArray, IsDate, IsOptional } from "class-validator";

export class EventsSearchDTO {
  @ApiPropertyOptional({ type: "string", isArray: true, required: false })
  @IsOptional()
  @IsArray()
  @ArrayUnique<string>()
  artistNames?: string[];

  @ApiPropertyOptional({ type: Date, required: false })
  @Type(() => Date)
  @IsOptional()
  @IsDate()
  startFrom?: Date;

  @ApiPropertyOptional({ type: Date, required: false })
  @Type(() => Date)
  @IsOptional()
  @IsDateMoreInFutureThan<EventsSearchDTO>("startFrom")
  startTo?: Date;
}
