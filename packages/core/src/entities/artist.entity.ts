import { hash } from "crypto";
import type { IArtist } from "@music-event-connect/shared/interfaces";
import { Expose, Transform } from "class-transformer";
import { IsArray, ArrayUnique, IsString, IsUrl } from "class-validator";
import { RDFClass, RDFProperty } from "../rdf/decorators";
import { ns } from "../rdf/ontology";
import { AbstractEntity } from "./abstract.entity";

@RDFClass(ns.schema.MusicGroup)
export class ArtistEntity extends AbstractEntity implements IArtist {
  @Expose()
  @Transform(({ value, obj }) => (value ? value : hash("sha256", obj["name"], "hex")))
  @IsString()
  override id: string;

  @Expose()
  @IsString()
  @RDFProperty(ns.schema.name)
  name: string;

  @Expose()
  @Transform(({ value }) => (value as string[]).map((str) => str.toLowerCase()))
  @IsArray()
  @ArrayUnique<string>()
  @RDFProperty(ns.schema.genre, { kind: "language", language: "en" })
  genres: string[];

  @Expose()
  @IsArray()
  @IsUrl({ protocols: ["http", "https"] }, { each: true })
  @ArrayUnique<string>()
  @RDFProperty(ns.schema.sameAs, { kind: "url" })
  sameAs: string[];

  @Expose()
  @IsArray()
  @IsUrl({ protocols: ["http", "https"] }, { each: true })
  @ArrayUnique<string>()
  @RDFProperty(ns.schema.image, { kind: "url" })
  images: string[];
}
