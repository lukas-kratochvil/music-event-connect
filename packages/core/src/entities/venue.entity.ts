import type { IVenue } from "@music-event-connect/shared/interfaces";
import { Expose, Type } from "class-transformer";
import { IsLatitude, IsLongitude, IsString, IsUUID, ValidateIf, ValidateNested } from "class-validator";
import { uuidv7 } from "uuidv7";
import { RDFClass, RDFProperty } from "../rdf/decorators";
import { ns } from "../rdf/ontology";
import { AbstractEntity } from "./abstract.entity";
import { AddressEntity } from "./address.entity";

@RDFClass(ns.schema.Place)
export class VenueEntity extends AbstractEntity implements IVenue {
  @IsUUID(7)
  // The easiest way to create ids for all the `MusicEventEntity` nested objects.
  // When entity is retrieved from the database the default value is overwritten.
  override id: string = uuidv7();

  @Expose()
  @IsString()
  @RDFProperty(ns.schema.name)
  name: string;

  @Expose()
  @ValidateIf((venue: IVenue) => venue.longitude !== undefined)
  @IsLatitude()
  @RDFProperty(ns.schema.latitude, { kind: "datatype", datatype: ns.xsd.decimal })
  latitude: number | undefined;

  @Expose()
  @ValidateIf((venue: IVenue) => venue.latitude !== undefined)
  @IsLongitude()
  @RDFProperty(ns.schema.longitude, { kind: "datatype", datatype: ns.xsd.decimal })
  longitude: number | undefined;

  @Expose()
  @Type(() => AddressEntity)
  @ValidateNested()
  @RDFProperty(ns.schema.address, { kind: "class", type: () => AddressEntity })
  address: AddressEntity;
}
