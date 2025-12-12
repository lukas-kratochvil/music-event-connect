import type { IArtist } from "@music-event-connect/shared/interfaces";
import { Expose, Transform } from "class-transformer";
import { IsArray, ArrayUnique, IsString, IsUrl, IsUUID } from "class-validator";
import { uuidv7 } from "uuidv7";
import { RDFClass, RDFProperty } from "../rdf/decorators";
import { ns } from "../rdf/ontology";
import { AbstractEntity } from "./abstract.entity";

@RDFClass(ns.schema.MusicGroup)
export class ArtistEntity extends AbstractEntity implements IArtist {
  @IsUUID(7)
  // The easiest way to create ids for all the `MusicEventEntity` nested objects.
  // When entity is retrieved from the database the default value is overwritten.
  override id: string = uuidv7();

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
}
