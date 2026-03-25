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
    return this.builder.SELECT.DISTINCT`${artistIRI}`.WHERE`
      GRAPH ${sourceGraph} {
        {
          ${artistIRI}  ${namedNode(ns.rdf.type)} ${namedNode(ns.mb.Artist)} ;
                        ${namedNode(ns.rdfs.label)} ${literal(artistName)} .
        } UNION {
          ${artistIRI}  ${namedNode(ns.rdf.type)} ${namedNode(ns.mb.Artist)} ;
                        ${namedNode(ns.skos.altLabel)} ${literal(artistName)} .
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
