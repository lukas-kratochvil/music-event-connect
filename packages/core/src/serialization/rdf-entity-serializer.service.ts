import { Injectable } from "@nestjs/common";
import { DataFactory, type NamedNode, type Quad } from "n3";
import { AbstractEntity } from "../entities";
import { RDF_METADATA_KEYS, type RDFPropertyMetadata } from "../rdf/decorators";
import { ns } from "../rdf/ontology";

const { literal, namedNode, triple } = DataFactory;

/**
 * Serialize domain object (entity) into RDF data.
 */
@Injectable()
export class RdfEntitySerializerService {
  static createEntityIRI(entity: AbstractEntity): NamedNode {
    const prefixIRI = Reflect.getMetadata(RDF_METADATA_KEYS.prefixIRI, entity.constructor) as string | undefined;

    if (typeof prefixIRI !== "string") {
      throw new Error("Missing @RDFPrefixIRI on " + entity.constructor.name);
    }

    return namedNode(prefixIRI + entity.id);
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  #serializeLiteral(rdfObject: {}) {
    if (typeof rdfObject === "string") {
      return rdfObject.replace(/"/g, '\\"');
    }
    if (rdfObject instanceof Date) {
      return rdfObject.toISOString();
    }
    return rdfObject.toString();
  }

  #serializeRDFProperty(
    rdfSubjectIRI: NamedNode,
    rdfPredicate: string,
    rdfObject: {}, // eslint-disable-line @typescript-eslint/no-empty-object-type
    options: RDFPropertyMetadata["options"],
    quads: Quad[]
  ) {
    // array
    if (Array.isArray(rdfObject)) {
      rdfObject.forEach((item: unknown) => {
        if (item !== null && item !== undefined) {
          this.#serializeRDFProperty(rdfSubjectIRI, rdfPredicate, item, options, quads);
        }
      });
      return;
    }

    switch (options?.kind) {
      case "class": {
        if (rdfObject instanceof AbstractEntity) {
          const objectIRI = RdfEntitySerializerService.createEntityIRI(rdfObject);
          quads.push(triple(rdfSubjectIRI, namedNode(rdfPredicate), objectIRI));
          this.#serializeRDFClass(rdfObject, objectIRI, quads);
          return;
        }
        throw new Error(options.type().name + " does not have an id");
      }
      case "enum": {
        if (typeof rdfObject === "string") {
          const enumValueIRI = options.map[rdfObject];

          if (!enumValueIRI) {
            throw new Error(`No mapping for '${rdfObject}' enum value on property '${rdfPredicate}'`);
          }

          quads.push(triple(rdfSubjectIRI, namedNode(rdfPredicate), namedNode(enumValueIRI)));
          return;
        }
        throw new Error(rdfObject.toString() + " is not a string");
      }
      case "datatype": {
        const literalValue = this.#serializeLiteral(rdfObject);
        quads.push(triple(rdfSubjectIRI, namedNode(rdfPredicate), literal(literalValue, namedNode(options.datatype))));
        return;
      }
      case "language": {
        const literalValue = this.#serializeLiteral(rdfObject);
        quads.push(triple(rdfSubjectIRI, namedNode(rdfPredicate), literal(literalValue, options.language)));
        return;
      }
      case undefined: {
        const literalValue = this.#serializeLiteral(rdfObject);
        quads.push(triple(rdfSubjectIRI, namedNode(rdfPredicate), literal(literalValue)));
        return;
      }
    }
  }

  #serializeRDFClass(entity: AbstractEntity, subjectIRI?: NamedNode, quads: Quad[] = []): Quad[] {
    const classIRI = Reflect.getMetadata(RDF_METADATA_KEYS.class, entity.constructor) as string | undefined;

    if (typeof classIRI !== "string") {
      throw new Error("Missing @RDFClass on " + entity.constructor.name);
    }

    const rdfSubjectIRI = subjectIRI ?? RdfEntitySerializerService.createEntityIRI(entity);
    quads.push(triple(rdfSubjectIRI, namedNode(ns.rdf.type), namedNode(classIRI)));

    for (const [propKey, propValue] of Object.entries(entity) as [string, unknown][]) {
      if (propValue === null || propValue === undefined) {
        continue;
      }

      const propMetadata = Reflect.getMetadata(RDF_METADATA_KEYS.property, entity.constructor, propKey) as
        | RDFPropertyMetadata
        | undefined;

      if (!propMetadata) {
        continue;
      }

      this.#serializeRDFProperty(rdfSubjectIRI, propMetadata.iri, propValue, propMetadata.options, quads);
    }

    return quads;
  }

  serialize(entity: AbstractEntity): Quad[] {
    return this.#serializeRDFClass(entity);
  }
}
