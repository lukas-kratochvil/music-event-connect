import type { IMusicEvent } from "@music-event-connect/shared/interfaces";
import { Expose, Transform, Type } from "class-transformer";
import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsDate,
  IsOptional,
  IsString,
  IsUrl,
  ValidateNested,
} from "class-validator";
import { RDFClass, RDFProperty } from "../rdf/decorators";
import { ns } from "../rdf/ontology";
import { createEntityId, isEntityId } from "../utils/entity-id";
import { IsDateEqualOrMoreInFutureThan, IsDateMoreInFutureThan, IsFutureDate } from "../validation";
import { AbstractEntity } from "./abstract.entity";
import { ArtistEntity } from "./artist.entity";
import type { EntityClassTransformOptions } from "./context";
import { TicketEntity } from "./ticket.entity";
import { VenueEntity } from "./venue.entity";

@RDFClass(ns.schema.MusicEvent)
export class MusicEventEntity extends AbstractEntity implements IMusicEvent {
  // Disable class-validator ESLint rules, because `id` validators are applied in the AbstractEntity.
  // eslint-disable-next-line @darraghor/nestjs-typed/all-properties-are-whitelisted, @darraghor/nestjs-typed/all-properties-have-explicit-defined
  @Expose()
  @Transform(({ value, options }) => {
    if (typeof value === "string" && isEntityId(value)) {
      return value;
    }
    const origin = (options as EntityClassTransformOptions).context.origin;
    return createEntityId(origin, value);
  })
  override id: string;

  @Expose()
  @IsString()
  @RDFProperty(ns.schema.name)
  name: string;

  @Expose()
  @IsUrl({ protocols: ["http", "https"] })
  @RDFProperty(ns.schema.url, { kind: "url" })
  url: string;

  @Expose()
  @Type(() => ArtistEntity)
  @IsOptional()
  @IsArray()
  @ArrayUnique<ArtistEntity>((elem) => elem.name)
  @ValidateNested({ each: true })
  @RDFProperty(ns.schema.performer, { kind: "class", type: () => ArtistEntity })
  artists?: ArtistEntity[];

  @Expose()
  @Type(() => VenueEntity)
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique<VenueEntity>((elem) => elem.name)
  @ValidateNested({ each: true })
  @RDFProperty(ns.schema.location, { kind: "class", type: () => VenueEntity })
  venues: VenueEntity[];

  @Expose()
  @Type(() => Date)
  @IsOptional()
  @IsFutureDate()
  @RDFProperty(ns.schema.doorTime, { kind: "datatype", datatype: ns.xsd.dateTime })
  doorTime: Date | undefined;

  @Expose()
  @Type(() => Date)
  @IsDate()
  @IsFutureDate()
  @IsDateEqualOrMoreInFutureThan<MusicEventEntity>("doorTime")
  @RDFProperty(ns.schema.startDate, { kind: "datatype", datatype: ns.xsd.dateTime })
  startDate: Date;

  @Expose()
  @Type(() => Date)
  @IsOptional()
  @IsDate()
  @IsFutureDate()
  @IsDateMoreInFutureThan<MusicEventEntity>("startDate")
  @RDFProperty(ns.schema.endDate, { kind: "datatype", datatype: ns.xsd.dateTime })
  endDate: Date | undefined;

  @Expose()
  @Type(() => TicketEntity)
  @ValidateNested()
  @RDFProperty(ns.schema.offers, { kind: "class", type: () => TicketEntity })
  ticket: TicketEntity;

  @Expose()
  @IsOptional()
  @IsArray()
  @IsUrl({ protocols: ["http", "https"] }, { each: true })
  @ArrayUnique<string>()
  @RDFProperty(ns.schema.image, { kind: "url" })
  images?: string[];
}
