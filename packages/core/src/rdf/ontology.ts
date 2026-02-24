import type { StrictOmit } from "@music-event-connect/shared";
import type { ItemAvailability } from "@music-event-connect/shared/interfaces";
import { foaf, rdf, schema, xsd } from "rdf-namespaces";

/**
 * RDF prefixes used in the project.
 */
export const prefixes = {
  foaf: "https://xmlns.com/foaf/spec/",
  mec: "http://music-event-connect.cz/entity/",
  rdf: "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
  schema: "http://schema.org/",
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
 * RDF namespaces used in the project.
 */
export const ns = {
  foaf: foaf as FoafSubset,
  rdf,
  schema: {
    ...schemaItemAvailabilityEnum,
    ...schema,
  } as SchemaSubset,
  xsd,
} satisfies Record<keyof StrictOmit<typeof prefixes, "mec">, object>;
