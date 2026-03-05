import { hash } from "crypto";
import type { IOnlineAccount } from "@music-event-connect/shared/interfaces";
import { Expose, Transform } from "class-transformer";
import { IsString, IsUrl } from "class-validator";
import { RDFClass, RDFProperty } from "../rdf/decorators";
import { ns } from "../rdf/ontology";
import { createEntityId, isEntityId } from "../utils/entity-id";
import { AbstractEntity } from "./abstract.entity";
import type { EntityClassTransformOptions } from "./context";

@RDFClass(ns.foaf.OnlineAccount)
export class OnlineAccountEntity extends AbstractEntity implements IOnlineAccount {
  // Disable class-validator ESLint rules, because `id` validators are applied in the AbstractEntity.
  // eslint-disable-next-line @darraghor/nestjs-typed/all-properties-are-whitelisted, @darraghor/nestjs-typed/all-properties-have-explicit-defined
  @Expose()
  @Transform(({ value, obj, options }) => {
    if (typeof value === "string" && isEntityId(value)) {
      return value;
    }
    const origin = (options as EntityClassTransformOptions).context.origin;
    return createEntityId(origin, hash("sha256", obj["url"], "hex"));
  })
  override id: string;

  @Expose()
  @IsUrl({ protocols: ["http", "https"] })
  @RDFProperty(ns.schema.url, { kind: "url" })
  url: string;

  @Expose()
  @Transform(({ obj }) => new URL(obj["url"]).pathname.split("/").filter(Boolean).at(-1))
  @IsString()
  @RDFProperty(ns.foaf.accountName)
  accountName: string;

  @Expose()
  @Transform(({ obj }) => new URL(obj["url"]).origin)
  @IsUrl({ protocols: ["http", "https"] })
  @RDFProperty(ns.foaf.accountServiceHomepage, { kind: "url" })
  accountServiceHomepage: string;
}
