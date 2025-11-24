import { IsUUID } from "class-validator";
import { uuidv7 } from "uuidv7";
import { RDFPrefixIRI, RDFProperty } from "../rdf/decorators";
import { ns, prefixes } from "../rdf/ontology";

@RDFPrefixIRI(prefixes.mec)
export abstract class AbstractEntity {
  @IsUUID(7)
  @RDFProperty(ns.schema.identifier)
  // The easiest way to create ids for all the nested objects.
  // When entity is retrieved from the database the default value is overwritten.
  id: string = uuidv7();
}
