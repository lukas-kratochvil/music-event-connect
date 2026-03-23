import { IsDateMoreInFutureThan } from "@music-event-connect/core/validation";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { ArrayUnique, IsArray, IsDate, IsEnum, IsOptional, IsString, ValidateNested } from "class-validator";
import { SortType } from "../interfaces/search.interface";

class Filters {
  @ApiPropertyOptional({ type: "string", isArray: true })
  @IsOptional()
  @IsArray()
  @ArrayUnique<string>()
  @IsString({ each: true })
  artistNames?: string[];

  @ApiPropertyOptional({ type: Date })
  @Type(() => Date)
  @IsOptional()
  @IsDate()
  startFrom?: Date;

  @ApiPropertyOptional({ type: Date })
  @Type(() => Date)
  @IsOptional()
  @IsDateMoreInFutureThan<Filters>("startFrom")
  startTo?: Date;
}

class Sorter {
  @ApiProperty({ type: "string" })
  @IsString()
  propertyName: string;

  @ApiProperty({ enum: SortType })
  @IsEnum(SortType)
  type: SortType;
}

export class EventsSearchDTO {
  @ApiPropertyOptional({ type: () => Filters })
  @Type(() => Filters)
  @IsOptional()
  @ValidateNested()
  filters?: Filters;

  @ApiPropertyOptional({ type: () => Sorter, isArray: true })
  @Type(() => Sorter)
  @IsOptional()
  @IsArray()
  @ArrayUnique<Sorter>((elem) => elem.propertyName)
  @ValidateNested({ each: true })
  sorters?: Sorter[];
}
