import { IsDateMoreInFutureThan } from "@music-event-connect/core/validation";
import type {
  IEventSearchDateRange,
  IEventSearchFilters,
  IEventSearchOptions,
  IEventSearchPagination,
  IEventSearchSorters,
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
  Max,
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

class SorterOptions {
  @ApiPropertyOptional({ type: "boolean", description: "The default is ascending order." })
  @IsOptional()
  @IsBoolean()
  desc?: boolean;
}

class Sorters implements IEventSearchSorters {
  @ApiPropertyOptional({ type: () => SorterOptions })
  @Type(() => SorterOptions)
  @IsOptional()
  @ValidateNested()
  startDate?: SorterOptions;
}

class Pagination implements IEventSearchPagination {
  @ApiProperty({ type: "number", minimum: 0, default: 0 })
  @IsInt()
  @Min(0)
  offset: number;

  @ApiProperty({ type: "number", minimum: 1, maximum: 100, default: 20 })
  @IsInt()
  @IsPositive()
  @Max(100)
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

  @ApiPropertyOptional({ type: () => Sorters })
  @Type(() => Sorters)
  @IsOptional()
  @ValidateNested()
  sorters?: Sorters;
}
