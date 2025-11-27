import { IsArray, ArrayUnique, IsString, IsUrl } from "class-validator";
import { Expose, Transform } from "class-transformer";
import type { IArtist } from "../interfaces";
import { RDFClass, RDFProperty } from "../rdf/decorators";
import { ns } from "../rdf/ontology";
import { AbstractEntity } from "./abstract.entity";

@RDFClass(ns.schema.MusicGroup)
export class ArtistEntity extends AbstractEntity implements IArtist {
  @Expose()
  @IsString()
  @RDFProperty(ns.schema.name)
  name: string;

  @Expose()
  @Transform(({ value }) => (value as string[]).map((str) => str.toLowerCase()))
  @IsArray()
  @ArrayUnique<string>()
  @RDFProperty(ns.schema.genre, { discriminator: "language", language: "en" })
  genres: string[];

  @Expose()
  @IsArray()
  @IsUrl({ protocols: ["http", "https"] }, { each: true })
  @ArrayUnique<string>()
  @RDFProperty(ns.schema.sameAs, { discriminator: "datatype", datatype: ns.xsd.anyURI })
  sameAs: string[];
}
