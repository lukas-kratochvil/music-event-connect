import { hash } from "crypto";
import type { IOnlineAccount } from "@music-event-connect/shared/interfaces";
import { Expose, Transform } from "class-transformer";
import { IsString, IsUrl } from "class-validator";
import { RDFClass, RDFProperty } from "../rdf/decorators";
import { ns } from "../rdf/ontology";
import { AbstractEntity } from "./abstract.entity";

@RDFClass(ns.foaf.OnlineAccount)
export class OnlineAccountEntity extends AbstractEntity implements IOnlineAccount {
  @Expose()
  @Transform(({ value, obj }) => (value ? value : hash("sha256", obj["url"], "hex")))
  @IsString()
  override id: string;

  @Expose()
  @IsUrl({ protocols: ["http", "https"] })
  @RDFProperty(ns.schema.url, { kind: "url" })
  url: string;

  @Expose()
  @Transform(({ obj }) =>
    new URL(obj["url"]).pathname
      .split("/")
      .filter((part) => !!part)
      .slice(-1)
  )
  @IsString()
  @RDFProperty(ns.foaf.accountName)
  accountName: string;

  @Expose()
  @Transform(({ obj }) => new URL(obj["url"]).origin)
  @IsUrl({ protocols: ["http", "https"] })
  @RDFProperty(ns.foaf.accountServiceHomepage, { kind: "url" })
  accountServiceHomepage: string;
}
