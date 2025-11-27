import { RDFPrefixIRI, RDFProperty } from "../rdf/decorators";
import { ns, prefixes } from "../rdf/ontology";

@RDFPrefixIRI(prefixes.mec)
export abstract class AbstractEntity {
  @RDFProperty(ns.schema.identifier)
  abstract id: string;
}
