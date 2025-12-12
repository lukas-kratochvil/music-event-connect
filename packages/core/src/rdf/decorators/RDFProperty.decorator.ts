import type { ClassConstructor } from "class-transformer";
import type { AbstractEntity } from "../../entities";
import { RDF_METADATA_KEYS } from "./metadata-keys";

type RDFPropertyOptions<TFieldType extends string> =
  | {
      /**
       * Indicates that the property has a datatype literal value. Cannot be used together with `language`.
       */
      kind: "datatype";
      /**
       * Datatype IRI of the literal value.
       */
      datatype: string;
    }
  | {
      /**
       * Indicates that the property has a language-tagged literal value. Cannot be used together with `datatype`.
       */
      kind: "language";
      /**
       * Language tag of the literal value in [ISO 639-1](https://en.wikipedia.org/wiki/List_of_ISO_639_language_codes) format.
       */
      language: string;
    }
  | {
      /**
       * Indicates that the property is a URL and must be represented as an IRI in the RDF triple.
       */
      kind: "url";
    }
  | {
      /**
       * Indicates that the property is a class.
       */
      kind: "class";
      /**
       * Mapping of enum values to their corresponding IRIs.
       */
      type: () => ClassConstructor<AbstractEntity>;
    }
  | {
      /**
       * Indicates that the property is an enumeration value.
       */
      kind: "enum";
      /**
       * Mapping of enum values to their corresponding IRIs.
       */
      map: Record<TFieldType, string>;
    };

export type RDFPropertyMetadata<TFieldType extends string = string> = {
  iri: string;
  options?: RDFPropertyOptions<TFieldType>;
};

export const RDFProperty = <TFieldType extends string = string>(
  iri: string,
  options?: RDFPropertyOptions<TFieldType>
): PropertyDecorator => {
  return (target, propertyKey) => {
    // define property metadata
    const metadataValue: RDFPropertyMetadata<TFieldType> = { iri, options };
    Reflect.defineMetadata(RDF_METADATA_KEYS.property, metadataValue, target.constructor, propertyKey);

    // register this property key in the RDF class property set
    const classProperties: Set<string | symbol>
      = Reflect.getMetadata(RDF_METADATA_KEYS.classProperties, target.constructor) ?? new Set();
    classProperties.add(propertyKey);
    Reflect.defineMetadata(RDF_METADATA_KEYS.classProperties, classProperties, target.constructor);
  };
};
