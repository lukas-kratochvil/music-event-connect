import { Injectable } from "@nestjs/common";
import type { DatasetCore, Quad, Quad_Object } from "@rdfjs/types";
import type { ClassConstructor } from "class-transformer";
import { DataFactory, Store, type NamedNode } from "n3";
import { AbstractEntity } from "../entities";
import { RDF_METADATA_KEYS, type RDFPropertyMetadata } from "../rdf/decorators";
import { ns } from "../rdf/ontology";

/**
 * Deserialize RDF data into domain object (entity).
 */
@Injectable()
export class RdfEntityDeserializerService {
  #getEntityId<TEntity extends AbstractEntity>(cls: ClassConstructor<TEntity>, entityIRI: NamedNode): string {
    const prefixIRI = Reflect.getMetadata(RDF_METADATA_KEYS.prefixIRI, cls) as string | undefined;

    if (typeof prefixIRI === "string" && entityIRI.value.startsWith(prefixIRI)) {
      return entityIRI.value.replace(prefixIRI, "");
    }

    throw new Error(entityIRI.value + " does not match @RDFPrefixIRI: " + prefixIRI);
  }

  #deserializeRdfTerm(term: Quad_Object, options: RDFPropertyMetadata["options"], store: Store) {
    switch (options?.kind) {
      // nested object
      case "class": {
        const entityCls = options.type();
        return this.#deserializeRdfClass(entityCls, term as NamedNode, store);
      }
      // enum
      case "enum": {
        const mapping = Object.entries(options.map).find(([_key, val]) => val === term.value);
        return mapping?.[0] ?? null;
      }
      // literal
      case "datatype":
        // date
        if ([ns.xsd.dateTime, ns.xsd.date].includes(options.datatype)) {
          return new Date(term.value);
        }

        // number
        if ([ns.xsd.integer, ns.xsd.decimal, ns.xsd.double].includes(options.datatype)) {
          return Number(term.value);
        }

        // boolean
        if (options.datatype === ns.xsd.boolean) {
          return term.value === "true" || term.value === "1";
        }

        // other primitive types
        return term.value;
      // literal - language-tagged string
      case "language":
      case undefined:
        return term.value;
    }
  }

  #deserializeRdfClass<TEntity extends AbstractEntity>(
    cls: ClassConstructor<TEntity>,
    subjectIRI: NamedNode,
    store: Store
  ): TEntity {
    const entity = new cls();
    const classProperties = Reflect.getMetadata(RDF_METADATA_KEYS.classProperties, cls) as
      | Set<string | symbol>
      | undefined;

    if (!classProperties) {
      return entity;
    }

    entity.id = this.#getEntityId(cls, subjectIRI);

    for (const propertyKey of classProperties) {
      const propertyMetadata = Reflect.getMetadata(RDF_METADATA_KEYS.property, cls, propertyKey) as
        | RDFPropertyMetadata
        | undefined;

      if (!propertyMetadata) {
        continue;
      }

      const propertyQuads = store.match(subjectIRI, DataFactory.namedNode(propertyMetadata.iri)).toArray();

      if (propertyQuads.length === 0) {
        continue;
      }

      const designType = Reflect.getMetadata("design:type", entity, propertyKey);

      if (designType === Array) {
        const arrayValues = propertyQuads
          .map((quad) => this.#deserializeRdfTerm(quad.object, propertyMetadata.options, store))
          .filter((val) => val !== null && val !== undefined);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (entity as any)[propertyKey] = arrayValues;
      } else {
        const value = this.#deserializeRdfTerm(propertyQuads[0]!.object, propertyMetadata.options, store);

        if (value !== undefined && value !== null) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (entity as any)[propertyKey] = value;
        }
      }
    }

    return entity;
  }

  deserialize<TEntity extends AbstractEntity>(
    cls: ClassConstructor<TEntity>,
    entityIRI: NamedNode,
    dataset: DatasetCore
  ): TEntity {
    const quads: Quad[] = [];
    for (const quad of dataset) {
      quads.push(quad);
    }
    const store = new Store(quads);
    return this.#deserializeRdfClass(cls, entityIRI, store);
  }
}
