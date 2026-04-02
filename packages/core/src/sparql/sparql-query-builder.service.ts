import { Inject, Injectable } from "@nestjs/common";
import { DataFactory, type NamedNode, type Quad } from "n3";
import { SPARQL_PROVIDERS } from "../constants";
import { ns } from "../rdf/ontology";
import type { SparqlBuilderType } from "./util";

const { literal, namedNode, variable } = DataFactory;

export type Pagination = {
  limit: number;
  offset: number;
};

export type ConstructEventsFilters = {
  artistNames?: string[];
  startDateRange?: {
    from: Date | undefined;
    to?: Date | undefined;
  };
};

export type ConstructEventsSorters = {
  startDate?: {
    desc?: boolean;
  };
};

export const SPARQL_QUERY_BUILDER_VARIABLES = {
  selectLinks: {
    linkedResource: {
      iri: "linkedResource",
      graph: "sourceGraph",
    },
  },
  selectEventsByDate: {
    event: {
      iri: "eventIRI",
      name: "eventName",
    },
  },
  selectArtistsByName: {
    artist: {
      iri: "artistIRI",
    },
  },
  selectPlacesByCoords: {
    place: {
      iri: "placeIRI",
      name: "placeName",
      address: {
        iri: "addressIRI",
        street: "addressStreet",
      },
    },
  },
};

/**
 * SPARQL service for building [SPARQL 1.1 Query Language](http://www.w3.org/TR/2013/REC-sparql11-query-20130321/) queries.
 */
@Injectable()
export class SPARQLQueryBuilderService {
  constructor(@Inject(SPARQL_PROVIDERS.builder) private readonly builder: SparqlBuilderType) {}

  /**
   * Asks if the query pattern (quads) have solution.
   */
  ask(quads: Quad[], graphIRI: string | undefined) {
    const query = this.builder.ASK`${quads}`;
    return graphIRI ? query.FROM(namedNode(graphIRI)) : query;
  }

  /**
   * Constructs entity and also retrieves its nested objects max. 2 levels deep.
   */
  constructEntity(entityIRI: NamedNode, graphIRI: string | undefined) {
    const query = this.builder.CONSTRUCT`
      ?s ?p1 ?child .
      ?child ?p2 ?grandchild .
      ?grandchild ?p3 ?o .
    `.WHERE`
      VALUES ?s { ${entityIRI} }
      ?s ?p1 ?child .
      OPTIONAL {
        ?child ?p2 ?grandchild .
        OPTIONAL {
          ?grandchild ?p3 ?o .
        }
      }
    `;
    return graphIRI ? query.FROM(namedNode(graphIRI)) : query;
  }

  /**
   * Constructs events and also retrieves its nested entities max. 2 levels deep.
   */
  constructEvents(
    eventEntityTypeIRI: NamedNode,
    linksGraphIRI: string,
    pagination: Pagination,
    filters: ConstructEventsFilters | undefined,
    sorters: ConstructEventsSorters | undefined
  ) {
    // RDF terms setup
    const { rdf, schema, xsd } = ns;
    const linksGraph = namedNode(linksGraphIRI);
    const event = variable("event");
    const startDate = variable("startDate");
    const startDateGrouped = variable("startDateGrouped");
    const artistName = variable("artistName");

    // Filters
    let filterClauses = "";

    if (filters?.startDateRange) {
      const { from, to } = filters.startDateRange;
      if (from) {
        filterClauses += `FILTER (${startDate} >= ${literal(from.toISOString(), namedNode(xsd.dateTime))})\n`;
      }
      if (to) {
        filterClauses += `FILTER (${startDate} <= ${literal(to.toISOString(), namedNode(xsd.dateTime))})\n`;
      }
    }

    // the length must be greater than 0 otherwise `?var IN ()` is always false so no triples will be returned
    if (filters?.artistNames && filters.artistNames.length > 0) {
      const names = filters.artistNames.map((name) => `"${name}"`).join(", ");
      filterClauses += `FILTER (${artistName} IN (${names}))\n`;
    }

    // Pagination
    const { limit, offset } = pagination;

    return this.builder.CONSTRUCT`
      ${event} ?p1 ?child .
      ?child ?p2 ?grandchild .
      ?grandchild  ?p3 ?o .
    `.WHERE`
      {
        SELECT ${event} (MIN(${startDate}) AS ${startDateGrouped})
        WHERE {
          ${event} ${namedNode(rdf.type)} ${eventEntityTypeIRI} ;
                    ${namedNode(schema.startDate)} ${startDate} ;
                    ${namedNode(schema.performer)} ?artist .
          OPTIONAL {
            ?artist ${namedNode(schema.name)} ${artistName}
          }

          ${filterClauses}

          # take only one event out of all the linked events (because the same physical event can be stored from multiple sources)
          FILTER NOT EXISTS {
            GRAPH ${linksGraph} {
              { ${event} ${namedNode(schema.sameAs)} ?linkedEvent }
              UNION
              { ?linkedEvent ${namedNode(schema.sameAs)} ${event} }
            }
            FILTER (STR(?linkedEvent) < STR(${event}))
          }
        }
        GROUP BY ${event}
        ORDER BY ${sorters?.startDate?.desc ? "DESC" : "ASC"}(${startDateGrouped})
        LIMIT ${limit}
        OFFSET ${offset}
      }

      ${event} ?p1 ?child .
      OPTIONAL {
        ?child ?p2 ?grandchild .
        OPTIONAL {
          ?grandchild ?p3 ?o .
        }
      }
    `;
  }

  /**
   * Selects all the linked resources to the given resource.
   */
  selectLinks(sourceIRI: NamedNode, linksGraphIRI: string) {
    const linksGraph = namedNode(linksGraphIRI);
    const linkedResourceIRI = variable(SPARQL_QUERY_BUILDER_VARIABLES.selectLinks.linkedResource.iri);
    const linkedResourceGraph = variable(SPARQL_QUERY_BUILDER_VARIABLES.selectLinks.linkedResource.graph);

    return this.builder.SELECT.DISTINCT`${linkedResourceIRI} ${linkedResourceGraph}`.WHERE`
      GRAPH ${linksGraph} {
        {
          ${sourceIRI} ${namedNode(ns.schema.sameAs)} ${linkedResourceIRI} .
        }
        UNION
        {
          ${linkedResourceIRI} ${namedNode(ns.schema.sameAs)} ${sourceIRI} .
        }
      }

      GRAPH ${linkedResourceGraph} {
        ${linkedResourceIRI} ${variable("p")} ${variable("o")} .
      }

      FILTER (${linkedResourceGraph} != ${linksGraph})
    `;
  }

  /**
   * Selects all the Event entities for the given start date in the Event graph.
   */
  selectEventEntitiesByDate(startDate: Date, eventGraphIRI: string) {
    const sourceGraph = namedNode(eventGraphIRI);
    const eventIRI = variable(SPARQL_QUERY_BUILDER_VARIABLES.selectEventsByDate.event.iri);
    const eventName = variable(SPARQL_QUERY_BUILDER_VARIABLES.selectEventsByDate.event.name);
    const eventStartDate = variable("eventStartDate");
    const eventStartDatePrefix = startDate.toISOString().split("T").at(0);

    return this.builder.SELECT.DISTINCT`${eventIRI} ${eventName}`.WHERE`
        GRAPH ${sourceGraph} {
          ${eventIRI} ${namedNode(ns.rdf.type)} ${namedNode(ns.schema.MusicEvent)} ;
                      ${namedNode(ns.schema.name)} ${eventName} ;
                      ${namedNode(ns.schema.startDate)} ${eventStartDate} .
          FILTER(STRSTARTS(STR(${eventStartDate}), "${eventStartDatePrefix}"))
        }
      `;
  }

  /**
   * Selects all the Event entities for the given start date in the MusicBrainz graph.
   */
  selectMusicBrainzEventsByDate(startDate: Date, musicBrainzGraphIRI: string) {
    const sourceGraph = namedNode(musicBrainzGraphIRI);
    const eventIRI = variable(SPARQL_QUERY_BUILDER_VARIABLES.selectEventsByDate.event.iri);
    const eventName = variable(SPARQL_QUERY_BUILDER_VARIABLES.selectEventsByDate.event.name);
    const eventStartDate = variable("eventStartDate");
    const eventStartDatePrefix = startDate.toISOString().split("T").at(0);

    return this.builder.SELECT.DISTINCT`${eventIRI} ${eventName}`.WHERE`
        GRAPH ${sourceGraph} {
          ${eventIRI} ${namedNode(ns.rdf.type)} ${namedNode(ns.mb.Event)} ;
                      ${namedNode(ns.rdfs.label)} ${eventName} ;
                      ${namedNode(ns.wdt.startTime)} ${eventStartDate} .
          FILTER(STRSTARTS(STR(${eventStartDate}), "${eventStartDatePrefix}"))
        }
      `;
  }

  /**
   * Selects all the Artist entities by the given name in the Event graph.
   */
  selectArtistEntitiesByName(artistName: string, eventGraphIRI: string) {
    const sourceGraph = namedNode(eventGraphIRI);
    const artistIRI = variable(SPARQL_QUERY_BUILDER_VARIABLES.selectArtistsByName.artist.iri);
    return this.builder.SELECT.DISTINCT`${artistIRI}`.WHERE`
      GRAPH ${sourceGraph} {
        ${artistIRI}  ${namedNode(ns.rdf.type)} ${namedNode(ns.schema.MusicGroup)} ;
                      ${namedNode(ns.schema.name)} ${literal(artistName)} .
      }
    `;
  }

  /**
   * Selects all the Artist entities by the given name in the MusicBrainz graph.
   */
  selectMusicBrainzArtistsByName(artistName: string, musicBrainzGraphIRI: string) {
    const sourceGraph = namedNode(musicBrainzGraphIRI);
    const artistIRI = variable(SPARQL_QUERY_BUILDER_VARIABLES.selectArtistsByName.artist.iri);
    // for performance reasons, it's better to use UNION instead of the alternative property path (pipe)
    // in the extracted MusicBrainz RDF data, RDFS label and SKOS altLabel are mostly XSD strings and sometimes language-tagged literals
    // HACK: we must use `${literal(artistName)}^^<${ns.xsd.string}>` instead of `${literal(artistName, namedNode(ns.xsd.string))}`, because `literal()` strips the XSD string datatype as is the intended behavior for RDF 1.1, but Virtuoso is still using the RDF 1.0 specification: https://github.com/openlink/virtuoso-opensource/issues/728
    return this.builder.SELECT.DISTINCT`${artistIRI}`.WHERE`
      GRAPH ${sourceGraph} {
        {
          ${artistIRI}  ${namedNode(ns.rdf.type)} ${namedNode(ns.mb.Artist)} ;
                        ${namedNode(ns.rdfs.label)} ${literal(artistName)}^^<${ns.xsd.string}> .
        } UNION {
          ${artistIRI}  ${namedNode(ns.rdf.type)} ${namedNode(ns.mb.Artist)} ;
                        ${namedNode(ns.skos.altLabel)} ${literal(artistName)}^^<${ns.xsd.string}> .
        }
      }
    `;
  }

  /**
   * Selects all the Venue entities close enough to the given coordinates in the Event graph.
   *
   * @param toleranceInDegrees default tolerance is set to ~222 meters
   */
  selectPlaceEntitiesByCoords(latitude: number, longitude: number, eventGraphIRI: string, toleranceInDegrees = 0.002) {
    const sourceGraph = namedNode(eventGraphIRI);
    const placeIRI = variable(SPARQL_QUERY_BUILDER_VARIABLES.selectPlacesByCoords.place.iri);
    const placeName = variable(SPARQL_QUERY_BUILDER_VARIABLES.selectPlacesByCoords.place.name);
    const addressIRI = variable(SPARQL_QUERY_BUILDER_VARIABLES.selectPlacesByCoords.place.address.iri);
    const addressStreet = variable(SPARQL_QUERY_BUILDER_VARIABLES.selectPlacesByCoords.place.address.street);
    const latVar = variable("latitude");
    const lonVar = variable("longitude");

    return this.builder.SELECT.DISTINCT`${placeIRI} ${placeName} ${addressIRI} ${addressStreet}`.WHERE`
      GRAPH ${sourceGraph} {
        ${placeIRI} ${namedNode(ns.rdf.type)} ${namedNode(ns.schema.Place)} ;
                    ${namedNode(ns.schema.name)} ${placeName} ;
                    ${namedNode(ns.schema.latitude)} ${latVar} ;
                    ${namedNode(ns.schema.longitude)} ${lonVar} ;
                    ${namedNode(ns.schema.address)} ${addressIRI} .

        ${addressIRI} ${namedNode(ns.rdf.type)} ${namedNode(ns.schema.PostalAddress)} ;
                      ${namedNode(ns.schema.streetAddress)} ${addressStreet} .

        FILTER (
          ABS(${latVar} - ${latitude}) <= ${toleranceInDegrees} &&
          ABS(${lonVar} - ${longitude}) <= ${toleranceInDegrees}
        )
      }
    `;
  }

  /**
   * Selects all the Venue entities close enough to the given coordinates in the MusicBrainz graph.
   *
   * @param radiusInKm default radius is set to 222 meters
   */
  selectMusicBrainzPlacesByCoords(
    latitude: number,
    longitude: number,
    musicBrainzGraphIRI: string,
    radiusInKm = 0.222
  ) {
    const sourceGraph = namedNode(musicBrainzGraphIRI);
    const placeIRI = variable(SPARQL_QUERY_BUILDER_VARIABLES.selectPlacesByCoords.place.iri);
    const placeName = variable(SPARQL_QUERY_BUILDER_VARIABLES.selectPlacesByCoords.place.name);
    const coords = variable("coordinates");

    return this.builder.SELECT.DISTINCT`${placeIRI} ${placeName}`.WHERE`
      GRAPH ${sourceGraph} {
        ${placeIRI} ${namedNode(ns.rdf.type)} ${namedNode(ns.mb.Place)} ;
                    ${namedNode(ns.rdfs.label)} ${placeName} ;
                    ${namedNode(ns.wdt.coordinateLocation)} ${coords} .

        FILTER (bif:st_intersects(${coords}, bif:st_point(${longitude}, ${latitude}), ${radiusInKm}))
      }
    `;
  }
}
