import { hash } from "node:crypto";
import type { IArtist, IOnlineAccount } from "@music-event-connect/shared/interfaces";
import { Expose, Transform, Type } from "class-transformer";
import { ArrayUnique, IsArray, IsOptional, IsString, IsUrl, ValidateNested } from "class-validator";
import { RDFClass, RDFProperty } from "../rdf/decorators";
import { ns } from "../rdf/ontology";
import { createEntityId, isEntityId } from "../utils/entity-id";
import { AbstractEntity } from "./abstract.entity";
import type { EntityClassTransformOptions } from "./context";
import { OnlineAccountEntity } from "./online-account.entity";

@RDFClass(ns.schema.MusicGroup)
export class ArtistEntity extends AbstractEntity implements IArtist {
  // Disable class-validator ESLint rules, because `id` validators are applied in the AbstractEntity.
  // eslint-disable-next-line @darraghor/nestjs-typed/all-properties-are-whitelisted, @darraghor/nestjs-typed/all-properties-have-explicit-defined
  @Expose()
  @Transform(({ value, obj, options }) => {
    if (typeof value === "string" && isEntityId(value)) {
      return value;
    }
    const origin = (options as EntityClassTransformOptions).context.origin;
    return createEntityId(origin, hash("sha256", obj["name"], "hex"));
  })
  override id: string;

  @Expose()
  @IsString()
  @RDFProperty(ns.schema.name)
  name: string;

  @Expose()
  @Transform(({ value }) => (Array.isArray(value) ? (value as string[]).map((str) => str.toLowerCase()) : undefined))
  @IsOptional()
  @IsArray()
  @ArrayUnique<string>()
  @IsString({ each: true })
  @RDFProperty(ns.schema.genre, { kind: "language", language: "en" })
  genres?: string[];

  @Expose()
  @IsOptional()
  @IsArray()
  @IsUrl({ protocols: ["http", "https"] }, { each: true })
  @ArrayUnique<string>()
  @RDFProperty(ns.schema.url, { kind: "url" })
  urls?: string[];

  @Expose()
  @Type(() => OnlineAccountEntity)
  @IsOptional()
  @IsArray()
  @ArrayUnique<OnlineAccountEntity>((elem) => elem.url)
  @ValidateNested({ each: true })
  @RDFProperty(ns.foaf.account, { kind: "class", type: () => OnlineAccountEntity })
  accounts?: IOnlineAccount[];

  @Expose()
  @IsOptional()
  @IsArray()
  @IsUrl({ protocols: ["http", "https"] }, { each: true })
  @ArrayUnique<string>()
  @RDFProperty(ns.schema.image, { kind: "url" })
  images?: string[];
}
