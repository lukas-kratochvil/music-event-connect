import { IsDateMoreInFutureThan } from "@music-event-connect/core/validation";
import type {
  IEventSearchDateRange,
  IEventSearchFilters,
  IEventSearchOptions,
  IEventSearchPagination,
  IEventSearchSorter,
} from "@music-event-connect/shared/api";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsDate,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  Min,
  ValidateNested,
} from "class-validator";

class DateRange implements IEventSearchDateRange {
  @ApiPropertyOptional({ type: Date })
  @Type(() => Date)
  @IsOptional()
  @IsDate()
  from: Date | undefined;

  @ApiPropertyOptional({ type: Date })
  @Type(() => Date)
  @IsOptional()
  @IsDate()
  @IsDateMoreInFutureThan<DateRange>("from")
  to?: Date | undefined;
}

class Filters implements IEventSearchFilters {
  @ApiPropertyOptional({ type: "string", isArray: true })
  @IsOptional()
  @IsArray()
  @ArrayUnique<string>()
  @IsString({ each: true })
  artistNames?: string[];

  @ApiPropertyOptional({ type: () => DateRange })
  @Type(() => DateRange)
  @IsOptional()
  @ValidateNested()
  startDateRange?: DateRange;
}

class Sorter implements IEventSearchSorter {
  @ApiProperty({ type: "string" })
  @IsString()
  propertyName: string;

  @ApiPropertyOptional({ type: "boolean", description: "Ascending sort is default." })
  @IsOptional()
  @IsBoolean()
  desc?: boolean;
}

class Pagination implements IEventSearchPagination {
  @ApiProperty({ type: "number", default: 0 })
  @IsInt()
  @Min(0)
  offset: number;

  @ApiProperty({ type: "number", default: 20 })
  @IsInt()
  @IsPositive()
  limit: number;
}

export class EventsSearchOptions implements IEventSearchOptions {
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
