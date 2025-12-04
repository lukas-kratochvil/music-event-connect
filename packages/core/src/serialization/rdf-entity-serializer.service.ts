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

  #serializeRDFProperty(
    rdfSubjectIRI: NamedNode,
    rdfPredicate: string,
    rdfObject: {}, // eslint-disable-line @typescript-eslint/no-empty-object-type
    options: RDFPropertyMetadata["options"],
    quads: Quad[]
  ) {
    // Array
    if (Array.isArray(rdfObject)) {
      rdfObject.forEach((item: unknown) => {
        if (item !== null && item !== undefined) {
          this.#serializeRDFProperty(rdfSubjectIRI, rdfPredicate, item, options, quads);
        }
      });
      return;
    }

    // Nested object
    if (rdfObject instanceof AbstractEntity) {
      const objectIRI = RdfEntitySerializerService.createEntityIRI(rdfObject);
      quads.push(triple(rdfSubjectIRI, namedNode(rdfPredicate), objectIRI));
      this.#serializeRDFClass(rdfObject, objectIRI, quads);
      return;
    }

    // Enum
    if (options?.kind === "enum" && typeof rdfObject === "string") {
      const enumValueIRI = options.map[rdfObject];

      if (!enumValueIRI) {
        throw new Error(`No mapping for '${rdfObject}' enum value on property '${rdfPredicate}'`);
      }

      quads.push(triple(rdfSubjectIRI, namedNode(rdfPredicate), namedNode(enumValueIRI)));
      return;
    }

    // Literal
    let literalValue: string;
    if (typeof rdfObject === "string") {
      literalValue = rdfObject.replace(/"/g, '\\"');
    } else if (rdfObject instanceof Date) {
      literalValue = rdfObject.toISOString();
    } else {
      literalValue = rdfObject.toString();
    }

    if (options) {
      if (options.kind === "datatype") {
        quads.push(triple(rdfSubjectIRI, namedNode(rdfPredicate), literal(literalValue, namedNode(options.datatype))));
      } else if (options.kind === "language") {
        quads.push(triple(rdfSubjectIRI, namedNode(rdfPredicate), literal(literalValue, options.language)));
      }
    } else {
      quads.push(triple(rdfSubjectIRI, namedNode(rdfPredicate), literal(literalValue)));
    }
  }

  #serializeRDFClass(entity: AbstractEntity, subjectIRI?: NamedNode, quads: Quad[] = []): Quad[] {
    const classIRI = Reflect.getMetadata(RDF_METADATA_KEYS.class, entity.constructor) as string | undefined;

    if (typeof classIRI !== "string") {
      throw new Error("Missing @RDFClass on " + entity.constructor.name);
    }

    const rdfSubjectIRI = subjectIRI ?? RdfEntitySerializerService.createEntityIRI(entity);
    quads.push(triple(rdfSubjectIRI, namedNode(ns.rdf.type), namedNode(classIRI)));

    for (const [propertyKey, rdfObject] of Object.entries(entity) as [string, unknown][]) {
      if (rdfObject === null || rdfObject === undefined) {
        continue;
      }

      const propertyMetadata = Reflect.getMetadata(RDF_METADATA_KEYS.property, entity.constructor, propertyKey) as
        | RDFPropertyMetadata
        | undefined;

      if (!propertyMetadata) {
        continue;
      }

      this.#serializeRDFProperty(rdfSubjectIRI, propertyMetadata.iri, rdfObject, propertyMetadata.options, quads);
    }

    return quads;
  }

  serialize(entity: AbstractEntity): Quad[] {
    return this.#serializeRDFClass(entity);
  }
}
