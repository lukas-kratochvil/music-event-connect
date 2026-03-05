import { hash } from "crypto";
import { ItemAvailability, type ITicket } from "@music-event-connect/shared/interfaces";
import { Expose, Transform } from "class-transformer";
import { IsIn, IsUrl } from "class-validator";
import { RDFClass, RDFProperty } from "../rdf/decorators";
import { ns } from "../rdf/ontology";
import { createEntityId, isEntityId } from "../utils/entity-id";
import { AbstractEntity } from "./abstract.entity";
import type { EntityClassTransformOptions } from "./context";

@RDFClass(ns.schema.Offer)
export class TicketEntity extends AbstractEntity implements ITicket {
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
