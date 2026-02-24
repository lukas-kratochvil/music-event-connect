import { hash } from "crypto";
import type { IArtist, IOnlineAccount } from "@music-event-connect/shared/interfaces";
import { Expose, Transform, Type } from "class-transformer";
import { IsArray, ArrayUnique, IsString, IsUrl, ValidateNested } from "class-validator";
import { RDFClass, RDFProperty } from "../rdf/decorators";
import { ns } from "../rdf/ontology";
import { AbstractEntity } from "./abstract.entity";
import { OnlineAccountEntity } from "./online-account.entity";

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
  @Type(() => OnlineAccountEntity)
  @IsArray()
  @ArrayUnique<OnlineAccountEntity>((elem) => elem.url)
  @ValidateNested({ each: true })
  @RDFProperty(ns.foaf.account, { kind: "class", type: () => OnlineAccountEntity })
  accounts: IOnlineAccount[];

  @Expose()
  @IsArray()
  @IsUrl({ protocols: ["http", "https"] }, { each: true })
  @ArrayUnique<string>()
  @RDFProperty(ns.schema.image, { kind: "url" })
  images: string[];
}
