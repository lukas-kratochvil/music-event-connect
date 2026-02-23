import { hash } from "crypto";
import type { IVenue } from "@music-event-connect/shared/interfaces";
import { Expose, Transform, Type } from "class-transformer";
import { IsLatitude, IsLongitude, IsString, ValidateNested } from "class-validator";
import { RDFClass, RDFProperty } from "../rdf/decorators";
import { ns } from "../rdf/ontology";
import { AbstractEntity } from "./abstract.entity";
import { AddressEntity } from "./address.entity";

@RDFClass(ns.schema.Place)
export class VenueEntity extends AbstractEntity implements IVenue {
  @Expose()
  @Transform(({ value, obj }) => {
    if (value) {
      return value;
    }
    const uniqueStr = `${obj["name"]}-${obj["latitude"]}-${obj["longitude"]}`;
    return hash("sha256", uniqueStr, "hex");
  })
  @IsString()
  override id: string;

  @Expose()
  @IsString()
  @RDFProperty(ns.schema.name)
  name: string;

  @Expose()
  @IsLatitude()
  @RDFProperty(ns.schema.latitude, { kind: "datatype", datatype: ns.xsd.decimal })
  latitude: number;

  @Expose()
  @IsLongitude()
  @RDFProperty(ns.schema.longitude, { kind: "datatype", datatype: ns.xsd.decimal })
  longitude: number;

  @Expose()
  @Type(() => AddressEntity)
  @ValidateNested()
  @RDFProperty(ns.schema.address, { kind: "class", type: () => AddressEntity })
  address: AddressEntity;
}
