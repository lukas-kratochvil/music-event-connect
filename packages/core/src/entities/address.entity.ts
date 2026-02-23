import { hash } from "crypto";
import type { IAddress } from "@music-event-connect/shared/interfaces";
import { Expose, Transform } from "class-transformer";
import { IsISO31661Alpha2, IsOptional, IsString } from "class-validator";
import { RDFClass, RDFProperty } from "../rdf/decorators";
import { ns } from "../rdf/ontology";
import { AbstractEntity } from "./abstract.entity";

@RDFClass(ns.schema.PostalAddress)
export class AddressEntity extends AbstractEntity implements IAddress {
  @Expose()
  @Transform(({ value, obj }) => {
    if (value) {
      return value;
    }
    const uniqueStr = `${obj["country"]}-${obj["locality"]}-${obj["street"] ?? ""}`;
    return hash("sha256", uniqueStr, "hex");
  })
  @IsString()
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
