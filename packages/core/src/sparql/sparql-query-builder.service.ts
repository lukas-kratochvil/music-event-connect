import { Inject, Injectable } from "@nestjs/common";
import { DataFactory, type NamedNode, type Quad } from "n3";
import { SPARQL_PROVIDERS } from "../constants";
import { ns, prefixes } from "../rdf/ontology";
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
  selectLinkedEventOffers: {
    event: {
      id: "eventId",
      offer: {
        url: "offerURL",
        availability: "offerAvailability",
      },
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
  selectOSMSpotsNearby: {
    spot: {
      name: "placeName",
      type: "placeType",
      latitude: "placeLatitude",
      longitude: "placeLongitude",
      distInM: "placeDistInM",
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
    const linkedEventImage = variable("linkedEventImage");
    const eventArtist = variable("eventArtist");
    const linkedArtistImage = variable("linkedArtistImage");

    // Filters
    let filterClauses = "";

    if (filters?.startDateRange) {
      const { from, to } = filters.startDateRange;
      if (from) {
        filterClauses += `FILTER (?${startDate.value} >= "${from.toISOString()}"^^<${xsd.dateTime}>)\n`;
      }
      if (to) {
        filterClauses += `FILTER (?${startDate.value} <= "${to.toISOString()}"^^<${xsd.dateTime}>)\n`;
      }
    }

    // the length must be greater than 0 otherwise `?var IN ()` is always false so no triples will be returned
    if (filters?.artistNames && filters.artistNames.length > 0) {
      const names = filters.artistNames.map((name) => `"${name}"`).join(", ");
      filterClauses += `FILTER (?${artistName.value} IN (${names}))\n`;
    }

    // Pagination
    const { limit, offset } = pagination;

    return this.builder.CONSTRUCT`
      ${event} ?p1 ?child .
      ?child ?p2 ?grandchild .
      ?grandchild  ?p3 ?o .
      # linked events data
      ${event} ${namedNode(schema.image)} ${linkedEventImage} .
      ${eventArtist} ${namedNode(schema.image)} ${linkedArtistImage} .
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
        ORDER BY ${sorters?.startDate?.desc ? "DESC" : "ASC"}(${startDateGrouped}) ASC(${event})
        LIMIT ${limit}
        OFFSET ${offset}
      }

      # get data from the linked artists
      OPTIONAL {
        ${event} ${namedNode(schema.performer)} ${eventArtist} .

        GRAPH ${linksGraph} {
          { ${eventArtist} ${namedNode(schema.sameAs)} ?linkedArtist }
          UNION
          { ?linkedArtist ${namedNode(schema.sameAs)} ${eventArtist} }
        }

        ?linkedArtist ${namedNode(schema.image)} ${linkedArtistImage} .
      }

      # get all the data about the chosen event
      ${event} ?p1 ?child .
      OPTIONAL {
        ?child ?p2 ?grandchild .
        OPTIONAL {
          ?grandchild ?p3 ?o .
        }
      }
    `;
  }

  selectLinkedEventOffers(eventIRIs: NamedNode[], linksGraphIRI: string) {
    const { schema } = ns;
    const linksGraph = namedNode(linksGraphIRI);
    const eventId = variable(SPARQL_QUERY_BUILDER_VARIABLES.selectLinkedEventOffers.event.id);
    const linkedOfferTicketURL = variable(SPARQL_QUERY_BUILDER_VARIABLES.selectLinkedEventOffers.event.offer.url);
    const linkedOfferAvailability = variable(
      SPARQL_QUERY_BUILDER_VARIABLES.selectLinkedEventOffers.event.offer.availability
    );
    return this.builder.SELECT.DISTINCT`${eventId} ${linkedOfferTicketURL} ${linkedOfferAvailability}`.WHERE`
        VALUES ?event { ${eventIRIs} }

        GRAPH ${linksGraph} {
          { ?event ${namedNode(schema.sameAs)} ?linkedEvent }
          UNION
          { ?linkedEvent ${namedNode(schema.sameAs)} ?event }
        }

        ?event ${namedNode(schema.identifier)} ${eventId} .
        ?linkedEvent ${namedNode(schema.offers)} ?linkedOffer .
        ?linkedOffer ${namedNode(schema.url)} ${linkedOfferTicketURL} ;
                      ${namedNode(schema.availability)} ${linkedOfferAvailability} .
      `;
  }

  /**
   * Selects all the linked resources to the given resource.
   */
  selectLinks(sourceIRI: NamedNode, linksGraphIRI: string) {
    const { schema } = ns;
    const linksGraph = namedNode(linksGraphIRI);
    const linkedResourceIRI = variable(SPARQL_QUERY_BUILDER_VARIABLES.selectLinks.linkedResource.iri);
    const linkedResourceGraph = variable(SPARQL_QUERY_BUILDER_VARIABLES.selectLinks.linkedResource.graph);

    return this.builder.SELECT.DISTINCT`${linkedResourceIRI} ${linkedResourceGraph}`.WHERE`
      GRAPH ${linksGraph} {
        {
          ${sourceIRI} ${namedNode(schema.sameAs)} ${linkedResourceIRI} .
        }
        UNION
        {
          ${linkedResourceIRI} ${namedNode(schema.sameAs)} ${sourceIRI} .
        }
      }

      GRAPH ${linkedResourceGraph} {
        ${linkedResourceIRI} ?p ?o .
      }

      FILTER (${linkedResourceGraph} != ${linksGraph})
    `;
  }

  /**
   * Selects all the Event entities for the given start date in the Event graph.
   */
  selectEventEntitiesByDate(startDate: Date, eventGraphIRI: string) {
    const { rdf, schema } = ns;
    const sourceGraph = namedNode(eventGraphIRI);
    const eventIRI = variable(SPARQL_QUERY_BUILDER_VARIABLES.selectEventsByDate.event.iri);
    const eventName = variable(SPARQL_QUERY_BUILDER_VARIABLES.selectEventsByDate.event.name);
    const eventStartDate = variable("eventStartDate");
    const eventStartDatePrefix = literal(startDate.toISOString().split("T").at(0)!);

    return this.builder.SELECT.DISTINCT`${eventIRI} ${eventName}`.WHERE`
        GRAPH ${sourceGraph} {
          ${eventIRI} ${namedNode(rdf.type)} ${namedNode(schema.MusicEvent)} ;
                      ${namedNode(schema.name)} ${eventName} ;
                      ${namedNode(schema.startDate)} ${eventStartDate} .
          FILTER(STRSTARTS(STR(${eventStartDate}), ${eventStartDatePrefix}))
        }
      `;
  }

  /**
   * Selects all the Event entities for the given start date in the MusicBrainz graph.
   */
  selectMusicBrainzEventsByDate(startDate: Date, musicBrainzGraphIRI: string) {
    const { mb, rdf, rdfs, wdt } = ns;
    const sourceGraph = namedNode(musicBrainzGraphIRI);
    const eventIRI = variable(SPARQL_QUERY_BUILDER_VARIABLES.selectEventsByDate.event.iri);
    const eventName = variable(SPARQL_QUERY_BUILDER_VARIABLES.selectEventsByDate.event.name);
    const eventStartDate = variable("eventStartDate");
    const eventStartDatePrefix = literal(startDate.toISOString().split("T").at(0)!);

    return this.builder.SELECT.DISTINCT`${eventIRI} ${eventName}`.WHERE`
        GRAPH ${sourceGraph} {
          ${eventIRI} ${namedNode(rdf.type)} ${namedNode(mb.Event)} ;
                      ${namedNode(rdfs.label)} ${eventName} ;
                      ${namedNode(wdt.startTime)} ${eventStartDate} .
          FILTER(STRSTARTS(STR(${eventStartDate}), ${eventStartDatePrefix}))
        }
      `;
  }

  /**
   * Selects all the Artist entities by the given name in the Event graph.
   */
  selectArtistEntitiesByName(artistName: string, eventGraphIRI: string) {
    const { rdf, schema } = ns;
    const sourceGraph = namedNode(eventGraphIRI);
    const artistIRI = variable(SPARQL_QUERY_BUILDER_VARIABLES.selectArtistsByName.artist.iri);
    return this.builder.SELECT.DISTINCT`${artistIRI}`.WHERE`
      GRAPH ${sourceGraph} {
        ${artistIRI}  ${namedNode(rdf.type)} ${namedNode(schema.MusicGroup)} ;
                      ${namedNode(schema.name)} ${literal(artistName)} .
      }
    `;
  }

  /**
   * Selects all the Artist entities by the given name in the MusicBrainz graph.
   */
  selectMusicBrainzArtistsByName(artistName: string, musicBrainzGraphIRI: string) {
    const { mb, rdf, rdfs, skos, xsd } = ns;
    const sourceGraph = namedNode(musicBrainzGraphIRI);
    const artistIRI = variable(SPARQL_QUERY_BUILDER_VARIABLES.selectArtistsByName.artist.iri);
    // for performance reasons, it's better to use UNION instead of the alternative property path (pipe)
    // in the extracted MusicBrainz RDF data, RDFS label and SKOS altLabel are mostly XSD strings and sometimes language-tagged literals
    // HACK: we must use `${literal(artistName)}^^<${xsd.string}>` instead of `${literal(artistName, namedNode(xsd.string))}`, because `literal()` strips the XSD string datatype as is the intended behavior for RDF 1.1, but Virtuoso is still using the RDF 1.0 specification: https://github.com/openlink/virtuoso-opensource/issues/728
    return this.builder.SELECT.DISTINCT`${artistIRI}`.WHERE`
      GRAPH ${sourceGraph} {
        {
          ${artistIRI}  ${namedNode(rdf.type)} ${namedNode(mb.Artist)} ;
                        ${namedNode(rdfs.label)} ${literal(artistName)}^^<${xsd.string}> .
        } UNION {
          ${artistIRI}  ${namedNode(rdf.type)} ${namedNode(mb.Artist)} ;
                        ${namedNode(skos.altLabel)} ${literal(artistName)}^^<${xsd.string}> .
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
    const { rdf, schema } = ns;
    const sourceGraph = namedNode(eventGraphIRI);
    const placeIRI = variable(SPARQL_QUERY_BUILDER_VARIABLES.selectPlacesByCoords.place.iri);
    const placeName = variable(SPARQL_QUERY_BUILDER_VARIABLES.selectPlacesByCoords.place.name);
    const addressIRI = variable(SPARQL_QUERY_BUILDER_VARIABLES.selectPlacesByCoords.place.address.iri);
    const addressStreet = variable(SPARQL_QUERY_BUILDER_VARIABLES.selectPlacesByCoords.place.address.street);
    const latVar = variable("latitude");
    const lonVar = variable("longitude");

    return this.builder.SELECT.DISTINCT`${placeIRI} ${placeName} ${addressIRI} ${addressStreet}`.WHERE`
      GRAPH ${sourceGraph} {
        ${placeIRI} ${namedNode(rdf.type)} ${namedNode(schema.Place)} ;
                    ${namedNode(schema.name)} ${placeName} ;
                    ${namedNode(schema.latitude)} ${latVar} ;
                    ${namedNode(schema.longitude)} ${lonVar} ;
                    ${namedNode(schema.address)} ${addressIRI} .

        ${addressIRI} ${namedNode(rdf.type)} ${namedNode(schema.PostalAddress)} ;
                      ${namedNode(schema.streetAddress)} ${addressStreet} .

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
    const { mb, rdf, rdfs, wdt } = ns;
    const sourceGraph = namedNode(musicBrainzGraphIRI);
    const placeIRI = variable(SPARQL_QUERY_BUILDER_VARIABLES.selectPlacesByCoords.place.iri);
    const placeName = variable(SPARQL_QUERY_BUILDER_VARIABLES.selectPlacesByCoords.place.name);
    const coords = variable("coordinates");

    return this.builder.SELECT.DISTINCT`${placeIRI} ${placeName}`.WHERE`
      GRAPH ${sourceGraph} {
        ${placeIRI} ${namedNode(rdf.type)} ${namedNode(mb.Place)} ;
                    ${namedNode(rdfs.label)} ${placeName} ;
                    ${namedNode(wdt.coordinateLocation)} ${coords} .

        FILTER (bif:st_intersects(${coords}, bif:st_point(${longitude}, ${latitude}), ${radiusInKm}))
      }
    `;
  }

  /**
   * Selects all the places close to the given coordinates in the OSM graph.
   *
   * The place is one of: bus stop, tram stop, bar, fast-food, pub or restaurant.
   *
   * @param radiusInKm radius to search (in kilometers)
   * @param limit max number of results
   */
  selectOSMSpotsNearby(latitude: number, longitude: number, osmGraphIRI: string, radiusInKm: number, limit: number) {
    const sourceGraph = namedNode(osmGraphIRI);
    const name = variable(SPARQL_QUERY_BUILDER_VARIABLES.selectOSMSpotsNearby.spot.name);
    const type = variable(SPARQL_QUERY_BUILDER_VARIABLES.selectOSMSpotsNearby.spot.type);
    const lat = variable(SPARQL_QUERY_BUILDER_VARIABLES.selectOSMSpotsNearby.spot.latitude);
    const lon = variable(SPARQL_QUERY_BUILDER_VARIABLES.selectOSMSpotsNearby.spot.longitude);
    const distInM = variable(SPARQL_QUERY_BUILDER_VARIABLES.selectOSMSpotsNearby.spot.distInM);

    return this.builder.SELECT.DISTINCT`${name} ${type} ${lat} ${lon} (xsd:integer(ROUND(?dist * 1000)) AS ${distInM})`
      .WHERE`
        GRAPH ${sourceGraph} {
          ?place ${namedNode(`${prefixes.osmkey}name`)} ${name} ;
                  ${namedNode(`${prefixes.geo}hasGeometry`)}/${namedNode(`${prefixes.geo}asWKT`)} ?wkt .

          FILTER(REGEX(?wkt, "^POINT"))
          BIND(bif:st_distance(?wkt, bif:st_point(${longitude}, ${latitude})) AS ?dist)
          FILTER(?dist < ${radiusInKm})

          {
            {
              ?place ${namedNode(`${prefixes.osmkey}highway`)} "bus_stop" .
              BIND("bus_stop" AS ${type})
            }
            UNION
            {
              ?place ${namedNode(`${prefixes.osmkey}railway`)} "tram_stop" .
              BIND("tram_stop" AS ${type})
            }
            UNION
            {
              ?place ${namedNode(`${prefixes.osmkey}railway`)} "station" ;
                      ${namedNode(`${prefixes.osmkey}station`)} "subway" .
              BIND("subway_station" AS ${type})
            }
            UNION
            {
              ?place ${namedNode(`${prefixes.osmkey}amenity`)} ${type} .
              FILTER(${type} IN ("bar", "pub", "restaurant"))
            }
          }

          BIND(bif:st_y(?wkt) AS ${lat})
          BIND(bif:st_x(?wkt) AS ${lon})
        }
      `
      .ORDER()
      .BY(distInM)
      .LIMIT(limit);
  }
}
