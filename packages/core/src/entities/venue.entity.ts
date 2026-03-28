import { hash } from "node:crypto";
import type { IVenue } from "@music-event-connect/shared/interfaces";
import { Expose, Transform, Type } from "class-transformer";
import { IsLatitude, IsLongitude, IsString, ValidateNested } from "class-validator";
import { RDFClass, RDFProperty } from "../rdf/decorators";
import { ns } from "../rdf/ontology";
import { createEntityId, isEntityId } from "../utils/entity-id";
import { AbstractEntity } from "./abstract.entity";
import { AddressEntity } from "./address.entity";
import type { EntityClassTransformOptions } from "./context";

@RDFClass(ns.schema.Place)
export class VenueEntity extends AbstractEntity implements IVenue {
  // Disable class-validator ESLint rules, because `id` validators are applied in the AbstractEntity.
  // eslint-disable-next-line @darraghor/nestjs-typed/all-properties-are-whitelisted, @darraghor/nestjs-typed/all-properties-have-explicit-defined
  @Expose()
  @Transform(({ value, obj, options }) => {
    if (typeof value === "string" && isEntityId(value)) {
      return value;
    }
    const origin = (options as EntityClassTransformOptions).context.origin;
    const uniqueStr = `${obj["name"]}-${obj["latitude"]}-${obj["longitude"]}`;
    return createEntityId(origin, hash("sha256", uniqueStr, "hex"));
  })
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
