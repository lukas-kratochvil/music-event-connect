import { hash } from "crypto";
import type { IAddress } from "@music-event-connect/shared/interfaces";
import { Expose, Transform } from "class-transformer";
import { IsISO31661Alpha2, IsOptional, IsString } from "class-validator";
import { RDFClass, RDFProperty } from "../rdf/decorators";
import { ns } from "../rdf/ontology";
import { createEntityId, isEntityId } from "../utils/entity-id";
import { AbstractEntity } from "./abstract.entity";
import type { EntityClassTransformOptions } from "./context";

@RDFClass(ns.schema.PostalAddress)
export class AddressEntity extends AbstractEntity implements IAddress {
  // Disable class-validator ESLint rules, because `id` validators are applied in the AbstractEntity.
  // eslint-disable-next-line @darraghor/nestjs-typed/all-properties-are-whitelisted, @darraghor/nestjs-typed/all-properties-have-explicit-defined
  @Expose()
  @Transform(({ value, obj, options }) => {
    if (typeof value === "string" && isEntityId(value)) {
      return value;
    }
    const origin = (options as EntityClassTransformOptions).context.origin;
    const uniqueStr = `${obj["country"]}-${obj["locality"]}-${obj["street"] ?? ""}`;
    return createEntityId(origin, hash("sha256", uniqueStr, "hex"));
  })
  override id: string;

  @Expose()
  @IsISO31661Alpha2()
  @RDFProperty(ns.schema.addressCountry)
  country: "CZ";

  @Expose()
  @IsString()
  @RDFProperty(ns.schema.addressLocality)
  locality: string;

  @Expose()
  @IsOptional()
  @IsString()
  @RDFProperty(ns.schema.streetAddress)
  street: string | undefined;
}
