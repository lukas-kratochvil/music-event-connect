import { Expose } from "class-transformer";
import { IsISO31661Alpha2, IsOptional, IsString, IsUUID } from "class-validator";
import { uuidv7 } from "uuidv7";
import type { IAddress } from "../interfaces";
import { RDFClass, RDFProperty } from "../rdf/decorators";
import { ns } from "../rdf/ontology";
import { AbstractEntity } from "./abstract.entity";

@RDFClass(ns.schema.PostalAddress)
export class AddressEntity extends AbstractEntity implements IAddress {
  @IsUUID(7)
  // The easiest way to create ids for all the `MusicEventEntity` nested objects.
  // When entity is retrieved from the database the default value is overwritten.
  override id: string = uuidv7();

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
