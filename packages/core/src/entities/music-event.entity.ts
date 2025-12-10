import type { IMusicEvent } from "@music-event-connect/shared/interfaces";
import { Expose, Type } from "class-transformer";
import {
  Allow,
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsOptional,
  IsString,
  IsUrl,
  ValidateNested,
} from "class-validator";
import { RDFClass, RDFProperty } from "../rdf/decorators";
import { ns } from "../rdf/ontology";
import { IsDateEqualOrMoreInFutureThan, IsDateMoreInFutureThan, IsFutureDate, isMusicEventId } from "../validation";
import { AbstractEntity } from "./abstract.entity";
import { ArtistEntity } from "./artist.entity";
import { TicketEntity } from "./ticket.entity";
import { VenueEntity } from "./venue.entity";

@RDFClass(ns.schema.MusicEvent)
export class MusicEventEntity extends AbstractEntity implements IMusicEvent {
  @Expose()
  @Allow() // only to satisfy "@darraghor/nestjs-typed/all-properties-are-whitelisted" rule, because it does not recognize custom validators implemented with class-validator as class-validator's decorators
  @isMusicEventId()
  override id: string;

  @Expose()
  @IsString()
  @RDFProperty(ns.schema.name)
  name: string;

  @Expose()
  @IsUrl({ protocols: ["http", "https"] })
  @RDFProperty(ns.schema.url, { kind: "datatype", datatype: ns.xsd.anyURI })
  url: string;

  @Expose()
  @Type(() => ArtistEntity)
  @IsArray()
  @ArrayUnique<ArtistEntity>((elem) => elem.name)
  @ValidateNested({ each: true })
  @RDFProperty(ns.schema.performer, { kind: "class", type: () => ArtistEntity })
  artists: ArtistEntity[];

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
  @Allow() // only to satisfy "@darraghor/nestjs-typed/all-properties-are-whitelisted" rule, because it does not recognize custom validators implemented with class-validator as class-validator's decorators
  @IsFutureDate()
  @IsDateEqualOrMoreInFutureThan<MusicEventEntity>("doorTime")
  @RDFProperty(ns.schema.startDate, { kind: "datatype", datatype: ns.xsd.dateTime })
  startDate: Date;

  @Expose()
  @Type(() => Date)
  @IsOptional()
  @IsFutureDate()
  @IsDateMoreInFutureThan<MusicEventEntity>("startDate")
  @RDFProperty(ns.schema.endDate, { kind: "datatype", datatype: ns.xsd.dateTime })
  endDate: Date | undefined;

  @Expose()
  @Type(() => TicketEntity)
  @ValidateNested()
  @RDFProperty(ns.schema.offers, { kind: "class", type: () => TicketEntity })
  ticket: TicketEntity;
}
