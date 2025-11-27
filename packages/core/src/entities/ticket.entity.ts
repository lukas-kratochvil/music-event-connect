import { Expose } from "class-transformer";
import { IsIn, IsUrl, IsUUID } from "class-validator";
import { uuidv7 } from "uuidv7";
import { ItemAvailability, type ITicket } from "../interfaces";
import { RDFClass, RDFProperty } from "../rdf/decorators";
import { ns } from "../rdf/ontology";
import { AbstractEntity } from "./abstract.entity";

@RDFClass(ns.schema.Offer)
export class TicketEntity extends AbstractEntity implements ITicket {
  @IsUUID(7)
  // The easiest way to create ids for all the `MusicEventEntity` nested objects.
  // When entity is retrieved from the database the default value is overwritten.
  override id: string = uuidv7();

  @Expose()
  @IsUrl({ protocols: ["http", "https"] })
  @RDFProperty(ns.schema.url, { discriminator: "datatype", datatype: ns.xsd.anyURI })
  url: string;

  // eslint-disable-next-line @darraghor/nestjs-typed/validated-non-primitive-property-needs-type-decorator
  @Expose()
  @IsIn(Object.values(ItemAvailability))
  @RDFProperty<ItemAvailability>(ns.schema.availability, {
    discriminator: "enum",
    map: {
      [ItemAvailability.InStock]: ns.schema.InStock,
      [ItemAvailability.SoldOut]: ns.schema.SoldOut,
    },
  })
  availability: ItemAvailability;
}
