import { hash } from "crypto";
import { ItemAvailability, type ITicket } from "@music-event-connect/shared/interfaces";
import { Expose, Transform } from "class-transformer";
import { IsIn, IsString, IsUrl } from "class-validator";
import { RDFClass, RDFProperty } from "../rdf/decorators";
import { ns } from "../rdf/ontology";
import { AbstractEntity } from "./abstract.entity";

@RDFClass(ns.schema.Offer)
export class TicketEntity extends AbstractEntity implements ITicket {
  @Expose()
  @Transform(({ value, obj }) => (value ? value : hash("sha256", obj["url"], "hex")))
  @IsString()
  override id: string;

  @Expose()
  @IsUrl({ protocols: ["http", "https"] })
  @RDFProperty(ns.schema.url, { kind: "url" })
  url: string;

  // eslint-disable-next-line @darraghor/nestjs-typed/validated-non-primitive-property-needs-type-decorator
  @Expose()
  @IsIn(Object.values(ItemAvailability))
  @RDFProperty<ItemAvailability>(ns.schema.availability, {
    kind: "enum",
    map: {
      [ItemAvailability.InStock]: ns.schema.InStock,
      [ItemAvailability.SoldOut]: ns.schema.SoldOut,
    },
  })
  availability: ItemAvailability;
}
