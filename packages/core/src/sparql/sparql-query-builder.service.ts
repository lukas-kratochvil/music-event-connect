import { Inject, Injectable } from "@nestjs/common";
import type { SparqlTemplateResult } from "@tpluscode/sparql-builder" with { "resolution-mode": "import" };
import { DataFactory, type NamedNode, type Quad } from "n3";
import { SPARQL_PROVIDERS } from "../constants";
import { ns, nsPrefixes } from "../rdf/namespace";
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
  genres?: string[];
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
  selectMusicBrainzGenres: {
    genre: {
      iri: "genreIRI",
      name: "genreName",
    },
  },
} as const;

/**
 * SPARQL service for building [SPARQL 1.1 Query Language](http://www.w3.org/TR/2013/REC-sparql11-query-20130321/) queries.
 */
@Injectable()
export class SPARQLQueryBuilder {
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
      ${entityIRI} ?p1 ?child .
      ?child ?p2 ?grandchild .
      ?grandchild ?p3 ?o .
    `.WHERE`
      ${entityIRI} ?p1 ?child .
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
    const minStartDate = variable("minStartDate");
    const artistName = variable("artistName");
    const genreName = variable("genreName");
    const linkedEventImage = variable("linkedEventImage");
    const eventArtist = variable("eventArtist");
    const linkedArtistImage = variable("linkedArtistImage");

    // Filters
    const filterClauses: SparqlTemplateResult[] = [];

    if (filters?.startDateRange) {
      const { from, to } = filters.startDateRange;
      if (from) {
        filterClauses.push(
          this.builder.sparql`FILTER (${startDate} >= ${literal(from.toISOString(), namedNode(xsd.dateTime))})\n`
        );
      }
      if (to) {
        filterClauses.push(
          this.builder.sparql`FILTER (${startDate} <= ${literal(to.toISOString(), namedNode(xsd.dateTime))})\n`
        );
      }
    }

    // the length must be greater than 0 otherwise '?var IN ()' is always false and the SPARQL query will not return any triples
    if (filters?.artistNames && filters.artistNames.length > 0) {
      const artistLiterals = filters.artistNames.map((name) => literal(name.trim()));
      // the library automatically separates arrays with '\n', but the IN operator requires comma-separated values
      const escapedArtistNameArray = this.builder.sparql`${artistLiterals}`.toString().replaceAll("\n", ", ");
      filterClauses.push(this.builder.sparql`FILTER (${artistName} IN (${escapedArtistNameArray}))`);
    }

    // the length must be greater than 0 otherwise '?var IN ()' is always false and the SPARQL query will not return any triples
    if (filters?.genres && filters.genres.length > 0) {
      const genreLiterals = filters.genres.map((genre) => literal(genre.trim(), "en"));
      // the library automatically separates arrays with '\n', but the IN operator requires comma-separated values
      const escapedGenresArray = this.builder.sparql`${genreLiterals}`.toString().replaceAll("\n", ", ");
      filterClauses.push(this.builder.sparql`FILTER (${genreName} IN (${escapedGenresArray}))`);
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
        SELECT ${event} (MIN(${startDate}) AS ${minStartDate})
        WHERE {
          ${event} ${namedNode(rdf.type)} ${eventEntityTypeIRI} ;
                    ${namedNode(schema.startDate)} ${startDate} ;
                    ${namedNode(schema.performer)} ?artist .
          OPTIONAL {
            ?artist ${namedNode(schema.name)} ${artistName} ;
                    ${namedNode(schema.genre)} ${genreName} .
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
        ORDER BY ${sorters?.startDate?.desc ? "DESC" : "ASC"}(${minStartDate}) ASC(${event})
        LIMIT ${limit}
        OFFSET ${offset}
      }

      # get images from the linked events
      OPTIONAL {
        GRAPH ${linksGraph} {
          { ${event} ${namedNode(schema.sameAs)} ?linkedEvent }
          UNION
          { ?linkedEvent ${namedNode(schema.sameAs)} ${event} }
        }

        ?linkedEvent ${namedNode(schema.image)} ${linkedEventImage} .
      }

      # get images from the linked artists
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
    const VARIABLES = SPARQL_QUERY_BUILDER_VARIABLES.selectLinkedEventOffers;
    const eventId = variable(VARIABLES.event.id);
    const linkedOfferTicketURL = variable(VARIABLES.event.offer.url);
    const linkedOfferAvailability = variable(VARIABLES.event.offer.availability);
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
    const VARIABLES = SPARQL_QUERY_BUILDER_VARIABLES.selectLinks;
    const linkedResourceIRI = variable(VARIABLES.linkedResource.iri);
    const linkedResourceGraph = variable(VARIABLES.linkedResource.graph);

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
    const VARIABLES = SPARQL_QUERY_BUILDER_VARIABLES.selectEventsByDate;
    const eventIRI = variable(VARIABLES.event.iri);
    const eventName = variable(VARIABLES.event.name);
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
    const { mb, rdf, rdfs } = ns;
    const sourceGraph = namedNode(musicBrainzGraphIRI);
    const VARIABLES = SPARQL_QUERY_BUILDER_VARIABLES.selectEventsByDate;
    const eventIRI = variable(VARIABLES.event.iri);
    const eventName = variable(VARIABLES.event.name);
    const eventStartDate = variable("eventStartDate");
    const eventStartDatePrefix = literal(startDate.toISOString().split("T").at(0)!);

    return this.builder.SELECT.DISTINCT`${eventIRI} ${eventName}`.WHERE`
        GRAPH ${sourceGraph} {
          ${eventIRI} ${namedNode(rdf.type)} ${namedNode(mb.Event)} ;
                      ${namedNode(rdfs.label)} ${eventName} ;
                      ${namedNode(`${nsPrefixes.wdt}P580`)} ${eventStartDate} .
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
    const VARIABLES = SPARQL_QUERY_BUILDER_VARIABLES.selectArtistsByName;
    const artistIRI = variable(VARIABLES.artist.iri);
    return this.builder.SELECT`${artistIRI}`.WHERE`
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
    const VARIABLES = SPARQL_QUERY_BUILDER_VARIABLES.selectArtistsByName;
    const artistIRI = variable(VARIABLES.artist.iri);
    // performance: the indexing in triple stores works better by using UNION pattern graphs instead of the alternative property path (pipe)
    // in the extracted MusicBrainz RDF data, RDFS label and SKOS altLabel are mostly XSD strings and sometimes language-tagged literals
    // HACK: we must use `${literal(artistName)}^^<${xsd.string}>` instead of `${literal(artistName, namedNode(xsd.string))}`, because `literal()` strips the XSD string datatype as is the intended behavior for RDF 1.1, but Virtuoso is still using the RDF 1.0 specification: https://github.com/openlink/virtuoso-opensource/issues/728
    return this.builder.SELECT`${artistIRI}`.WHERE`
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
   * @param radiusInKm default radius is set to 200 meters
   */
  selectPlaceEntitiesByCoords(latitude: number, longitude: number, eventGraphIRI: string, radiusInKm = 0.2) {
    const { rdf, schema } = ns;
    const sourceGraph = namedNode(eventGraphIRI);
    const VARIABLES = SPARQL_QUERY_BUILDER_VARIABLES.selectPlacesByCoords;
    const placeIRI = variable(VARIABLES.place.iri);
    const placeName = variable(VARIABLES.place.name);
    const addressIRI = variable(VARIABLES.place.address.iri);
    const addressStreet = variable(VARIABLES.place.address.street);

    return this.builder.SELECT.DISTINCT`${placeIRI} ${placeName} ${addressIRI} ${addressStreet}`.WHERE`
      GRAPH ${sourceGraph} {
        BIND(bif:st_point(${longitude}, ${latitude}) AS ?centerPoint)

        ${placeIRI} ${namedNode(rdf.type)} ${namedNode(schema.Place)} ;
                    ${namedNode(schema.name)} ${placeName} ;
                    ${namedNode(schema.latitude)} ?lat ;
                    ${namedNode(schema.longitude)} ?lon ;
                    ${namedNode(schema.address)} ${addressIRI} .

        BIND(bif:st_distance(?centerPoint, bif:st_point(?lon, ?lat)) AS ?dist)
        FILTER(?dist < ${radiusInKm})

        ${addressIRI} ${namedNode(rdf.type)} ${namedNode(schema.PostalAddress)} ;
                      ${namedNode(schema.streetAddress)} ${addressStreet} .
      }
    `;
  }

  /**
   * Selects all the Venue entities close enough to the given coordinates in the MusicBrainz graph.
   *
   * @param radiusInKm default radius is set to 200 meters
   */
  selectMusicBrainzPlacesByCoords(latitude: number, longitude: number, musicBrainzGraphIRI: string, radiusInKm = 0.2) {
    const { mb, rdf, rdfs } = ns;
    const sourceGraph = namedNode(musicBrainzGraphIRI);
    const VARIABLES = SPARQL_QUERY_BUILDER_VARIABLES.selectPlacesByCoords;
    const placeIRI = variable(VARIABLES.place.iri);
    const placeName = variable(VARIABLES.place.name);

    return this.builder.SELECT.DISTINCT`${placeIRI} ${placeName}`.WHERE`
      GRAPH ${sourceGraph} {
        BIND(bif:st_point(${longitude}, ${latitude}) AS ?centerPoint)

        ${placeIRI} ${namedNode(rdf.type)} ${namedNode(mb.Place)} ;
                    ${namedNode(rdfs.label)} ${placeName} ;
                    ${namedNode(`${nsPrefixes.wdt}P625`)} ?coords .

        BIND(bif:st_distance(?centerPoint, ?coords) AS ?dist)
        FILTER(?dist < ${radiusInKm})
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
    const VARIABLES = SPARQL_QUERY_BUILDER_VARIABLES.selectOSMSpotsNearby;
    const name = variable(VARIABLES.spot.name);
    const type = variable(VARIABLES.spot.type);
    const lat = variable(VARIABLES.spot.latitude);
    const lon = variable(VARIABLES.spot.longitude);
    const distInM = variable(VARIABLES.spot.distInM);

    return this.builder.SELECT.DISTINCT`${name} ${type} ${lat} ${lon} (xsd:integer(ROUND(?dist * 1000)) AS ${distInM})`
      .WHERE`
        GRAPH ${sourceGraph} {
          BIND(bif:st_point(${longitude}, ${latitude}) AS ?centerPoint)

          {
            {
              ?place ${namedNode(`${nsPrefixes.osmkey}highway`)} "bus_stop" .
              BIND("bus_stop" AS ${type})
            }
            UNION
            {
              ?place ${namedNode(`${nsPrefixes.osmkey}railway`)} "tram_stop" .
              BIND("tram_stop" AS ${type})
            }
            UNION
            {
              ?place ${namedNode(`${nsPrefixes.osmkey}railway`)} "station" ;
                      ${namedNode(`${nsPrefixes.osmkey}station`)} "subway" .
              BIND("subway_station" AS ${type})
            }
            UNION
            {
              ?place ${namedNode(`${nsPrefixes.osmkey}amenity`)} ${type} .
              FILTER(${type} IN ("bar", "pub", "restaurant"))
            }
          }

          ?place ${namedNode(`${nsPrefixes.osmkey}name`)} ${name} ;
                  ${namedNode(`${nsPrefixes.geo}hasGeometry`)}/${namedNode(`${nsPrefixes.geo}asWKT`)} ?wkt .

          FILTER(REGEX(?wkt, "^POINT"))
          BIND(bif:st_distance(?centerPoint, ?wkt) AS ?dist)
          FILTER(?dist < ${radiusInKm})

          BIND(bif:st_x(?wkt) AS ${lon})
          BIND(bif:st_y(?wkt) AS ${lat})
        }
      `
      .ORDER()
      .BY(distInM)
      .LIMIT(limit);
  }

  /**
   * Selects all the Genre entities in the MusicBrainz graph.
   */
  selectMusicBrainzGenres(musicBrainzGraphIRI: string) {
    const { mb, rdf, rdfs } = ns;
    const sourceGraph = namedNode(musicBrainzGraphIRI);
    const VARIABLES = SPARQL_QUERY_BUILDER_VARIABLES.selectMusicBrainzGenres;
    const iri = variable(VARIABLES.genre.iri);
    const name = variable(VARIABLES.genre.name);
    return this.builder.SELECT.DISTINCT`${iri} ${name}`.WHERE`
      GRAPH ${sourceGraph} {
        ${iri} ${namedNode(rdf.type)} ${namedNode(mb.Genre)} ;
                ${namedNode(rdfs.label)} ${name} .
      }
    `;
  }
}
