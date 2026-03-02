import { Inject, Injectable } from "@nestjs/common";
import { DataFactory, type NamedNode, type Quad } from "n3";
import { SPARQL_PROVIDERS } from "../constants";
import { ns } from "../rdf/ontology";
import type { SparqlBuilderType } from "./util";

const { literal, namedNode, variable } = DataFactory;

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
    artist: {
      iri: "artistIRI",
      name: "artistName",
    },
    place: {
      iri: "placeIRI",
      name: "placeName",
      latitude: "placeLatitude",
      longitude: "placeLongitude",
    },
    address: {
      iri: "addressIRI",
      street: "addressStreet",
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
      ?grandchild  ?p3 ?o .
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
   * Selects all the linked resources to the given resource.
   */
  selectLinks(resourceIRI: NamedNode, linksGraphIRI: string) {
    const linksGraph = namedNode(linksGraphIRI);
    const linkedResourceIRI = variable(SPARQL_QUERY_BUILDER_VARIABLES.selectLinks.linkedResource.iri);
    const linkedResourceGraph = variable(SPARQL_QUERY_BUILDER_VARIABLES.selectLinks.linkedResource.graph);

    return this.builder.SELECT.DISTINCT`${linkedResourceIRI} ${linkedResourceGraph}`.WHERE`
      GRAPH ${linksGraph} {
        {
          ${resourceIRI} ${namedNode(ns.schema.sameAs)} ${linkedResourceIRI} .
        }
        UNION
        {
          ${linkedResourceIRI} ${namedNode(ns.schema.sameAs)} ${resourceIRI} .
        }
      }

      GRAPH ${linkedResourceGraph} {
        ${linkedResourceIRI} ${variable("p")} ${variable("o")} .
      }

      FILTER (${linkedResourceGraph} != ${linksGraph})
    `;
  }

  /**
   * Selects all the events for the given start date.
   */
  selectEventsByDate(startDate: Date, eventGraphIRI: string) {
    const sourceGraph = namedNode(eventGraphIRI);
    const eventIRI = variable(SPARQL_QUERY_BUILDER_VARIABLES.selectEventsByDate.event.iri);
    const eventName = variable(SPARQL_QUERY_BUILDER_VARIABLES.selectEventsByDate.event.name);
    const eventStartDate = variable("eventStartDate");
    const eventStartDatePrefix = startDate.toISOString().split("T").at(0);
    const artistIRI = variable(SPARQL_QUERY_BUILDER_VARIABLES.selectEventsByDate.artist.iri);
    const artistName = variable(SPARQL_QUERY_BUILDER_VARIABLES.selectEventsByDate.artist.name);
    const placeIRI = variable(SPARQL_QUERY_BUILDER_VARIABLES.selectEventsByDate.place.iri);
    const placeName = variable(SPARQL_QUERY_BUILDER_VARIABLES.selectEventsByDate.place.name);
    const placeLatitude = variable(SPARQL_QUERY_BUILDER_VARIABLES.selectEventsByDate.place.latitude);
    const placeLongitude = variable(SPARQL_QUERY_BUILDER_VARIABLES.selectEventsByDate.place.longitude);
    const addressIRI = variable(SPARQL_QUERY_BUILDER_VARIABLES.selectEventsByDate.address.iri);
    const addressStreet = variable(SPARQL_QUERY_BUILDER_VARIABLES.selectEventsByDate.address.street);

    return this.builder
      .SELECT`${eventIRI} ${eventName} ${artistIRI} ${artistName} ${placeIRI} ${placeName} ${placeLatitude} ${placeLongitude} ${addressIRI} ${addressStreet}`
      .WHERE`
        GRAPH ${sourceGraph} {
          ${eventIRI} ${namedNode(ns.rdf.type)} ${namedNode(ns.schema.MusicEvent)} ;
                      ${namedNode(ns.schema.name)} ${eventName} ;
                      ${namedNode(ns.schema.startDate)} ${eventStartDate} .
          FILTER(STRSTARTS(STR(${eventStartDate}), "${eventStartDatePrefix}"))

          OPTIONAL {
            ${eventIRI} ${namedNode(ns.schema.performer)} ${artistIRI} .
            ${artistIRI}  ${namedNode(ns.rdf.type)} ${namedNode(ns.schema.MusicGroup)} ;
                          ${namedNode(ns.schema.name)} ${artistName} .
          }

          OPTIONAL {
            ${eventIRI} ${namedNode(ns.schema.location)} ${placeIRI} .
            ${placeIRI} ${namedNode(ns.rdf.type)} ${namedNode(ns.schema.Place)} ;
                        ${namedNode(ns.schema.name)} ${placeName} ;
                        ${namedNode(ns.schema.latitude)} ${placeLatitude} ;
                        ${namedNode(ns.schema.longitude)} ${placeLongitude} ;
                        ${namedNode(ns.schema.address)} ${addressIRI} .

            ${addressIRI} ${namedNode(ns.rdf.type)} ${namedNode(ns.schema.PostalAddress)} .
            OPTIONAL { ${addressIRI} ${namedNode(ns.schema.streetAddress)} ${addressStreet} }
          }
        }
      `;
  }

  /**
   * Selects all the artists by the given name (case insensitive).
   */
  selectArtistsByName(artistName: string, eventGraphIRI: string) {
    const sourceGraph = namedNode(eventGraphIRI);
    const artistIRI = variable(SPARQL_QUERY_BUILDER_VARIABLES.selectArtistsByName.artist.iri);
    const name = variable("name");
    return this.builder.SELECT`${artistIRI}`.WHERE`
      GRAPH ${sourceGraph} {
        ${artistIRI}  ${namedNode(ns.rdf.type)} ${namedNode(ns.schema.MusicGroup)} ;
                      ${namedNode(ns.schema.name)} ${name} .
        FILTER(LCASE(${name}) = LCASE(${literal(artistName)}))
      }
    `;
  }

  /**
   * Selects all the venues close enough to the given coordinates.
   *
   * @param toleranceInDegrees default tolerance is set to ~222 meters
   */
  selectPlacesByCoords(latitude: number, longitude: number, eventGraphIRI: string, toleranceInDegrees = 0.002) {
    const sourceGraph = namedNode(eventGraphIRI);
    const venueIRI = variable(SPARQL_QUERY_BUILDER_VARIABLES.selectPlacesByCoords.place.iri);
    const name = variable(SPARQL_QUERY_BUILDER_VARIABLES.selectPlacesByCoords.place.name);
    const addressIRI = variable(SPARQL_QUERY_BUILDER_VARIABLES.selectPlacesByCoords.place.address.iri);
    const addressStreet = variable(SPARQL_QUERY_BUILDER_VARIABLES.selectPlacesByCoords.place.address.street);
    const latVar = variable("latitude");
    const lonVar = variable("longitude");

    return this.builder.SELECT`${venueIRI} ${name} ${addressIRI} ${addressStreet}`.WHERE`
      GRAPH ${sourceGraph} {
        ${venueIRI} ${namedNode(ns.rdf.type)} ${namedNode(ns.schema.Place)} ;
                    ${namedNode(ns.schema.name)} ${name} ;
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
}
