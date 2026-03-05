import { Allow } from "class-validator";
import { RDFPrefixIRI, RDFProperty } from "../rdf/decorators";
import { ns, prefixes } from "../rdf/ontology";
import { IsEntityId } from "../validation";

@RDFPrefixIRI(prefixes.mec)
export abstract class AbstractEntity {
  @Allow() // only to satisfy "@darraghor/nestjs-typed/all-properties-are-whitelisted" rule, because it does not recognize custom validators implemented with class-validator as class-validator's decorators
  @IsEntityId()
  @RDFProperty(ns.schema.identifier)
  abstract id: string;
}
