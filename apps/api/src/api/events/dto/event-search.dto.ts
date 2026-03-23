import { IsDateMoreInFutureThan } from "@music-event-connect/core/validation";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  ArrayUnique,
  IsArray,
  IsDate,
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  Min,
  ValidateNested,
} from "class-validator";
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

class Pagination {
  @ApiProperty({ type: "number", default: 0 })
  @IsInt()
  @Min(0)
  offset: number;

  @ApiProperty({ type: "number", default: 20 })
  @IsInt()
  @IsPositive()
  limit: number;
}

export class EventsSearchDTO {
  @ApiProperty({ type: () => Pagination })
  @Type(() => Pagination)
  @ValidateNested()
  pagination: Pagination;

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
