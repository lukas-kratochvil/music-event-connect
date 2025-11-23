import "reflect-metadata"; // modifies the native global Reflect object with metadata methods

export { RDF_METADATA_KEYS } from "./metadata-keys";
export { RDFClass } from "./RDFClass.decorator";
export { RDFPrefixIRI } from "./RDFPrefixIRI.decorator";
export { RDFProperty, type RDFPropertyMetadata } from "./RDFProperty.decorator";
