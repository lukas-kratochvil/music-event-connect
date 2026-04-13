import type { StrictOmit } from "@music-event-connect/shared";
import type { ItemAvailability } from "@music-event-connect/shared/interfaces";
import { foaf, rdf, rdfs, schema, skos, xsd } from "rdf-namespaces";

/**
 * The exhaustive list of RDF namespace prefixes used in this project.
 */
export const prefixes = {
  foaf: "https://xmlns.com/foaf/spec/",
  geo: "http://www.opengis.net/ont/geosparql#",
  mb: "https://linkedmusic.ca/graphs/musicbrainz/",
  mec: "http://music-event-connect.cz/entity/",
  osmkey: "https://www.openstreetmap.org/wiki/Key:",
  rdf: "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
  rdfs: "http://www.w3.org/2000/01/rdf-schema#",
  schema: "http://schema.org/",
  skos: "http://www.w3.org/2004/02/skos/core#",
  wdt: "http://www.wikidata.org/prop/direct/",
  xsd: "http://www.w3.org/2001/XMLSchema#",
} as const;

type FoafTypes = Pick<typeof foaf, "OnlineAccount">;

type FoafProperties = Pick<typeof foaf, "account" | "accountName" | "accountServiceHomepage">;

type FoafSubset = FoafTypes & FoafProperties;

type SchemaTypes = Pick<typeof schema, "MusicEvent" | "MusicGroup" | "Offer" | "Place" | "PostalAddress">;

type SchemaProperties = Pick<
  typeof schema,
  // Thing properties
  | "identifier"
  | "image"
  | "name"
  | "sameAs"
  | "url"

  // MusicEvent properties
  | "performer"
  | "location"
  | "doorTime"
  | "startDate"
  | "endDate"
  | "offers"

  // MusicGroup properties
  | "genre"

  // Offer properties
  | "availability"

  // Place properties
  | "address"
  | "latitude"
  | "longitude"

  // PostalAddress properties
  | "addressCountry"
  | "addressLocality"
  | "streetAddress"
>;

/**
 * ItemAvailability enum values subset (they are missing in `rdf-namespaces` package).
 * @see https://schema.org/ItemAvailability
 */
type SchemaItemAvailabilityEnum = {
  [K in ItemAvailability]: `${typeof prefixes.schema}${K}`;
};

const schemaItemAvailabilityEnum: SchemaItemAvailabilityEnum = {
  InStock: `${prefixes.schema}InStock`,
  SoldOut: `${prefixes.schema}SoldOut`,
} as const;

/**
 * [Schema.org](https://schema.org/) vocabulary subset used in the project.
 */
type SchemaSubset = SchemaTypes & SchemaProperties & SchemaItemAvailabilityEnum;

/**
 * The non-exhaustive list of RDF namespaces used in this project.
 *
 * It is not exhaustive, because some of required namespaces are not present in the third-party library `rdf-namespaces`.
 * If you cannot find the namespace try to use `prefixes` exported constant instead.
 */
export const ns = {
  foaf: foaf as FoafSubset,
  mb: {
    Area: `${prefixes.mb}Area`,
    Artist: `${prefixes.mb}Artist`,
    Event: `${prefixes.mb}Event`,
    Genre: `${prefixes.mb}Genre`,
    Place: `${prefixes.mb}Place`,
    ReleaseGroup: `${prefixes.mb}ReleaseGroup`,
  } as const,
  rdf,
  rdfs,
  schema: {
    ...schemaItemAvailabilityEnum,
    ...schema,
  } as SchemaSubset,
  skos,
  xsd,
} satisfies Record<keyof StrictOmit<typeof prefixes, "geo" | "mec" | "osmkey" | "wdt">, object>;
