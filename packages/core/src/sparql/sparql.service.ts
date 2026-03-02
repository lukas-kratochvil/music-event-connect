import { Inject, Injectable } from "@nestjs/common";
import type { Term } from "@rdfjs/types";
import type { NamedNode, Quad } from "n3";
import type { ParsingClient } from "sparql-http-client" with { "resolution-mode": "import" };
import { SPARQL_PROVIDERS } from "../constants";
import { SPARQL_QUERY_BUILDER_VARIABLES, SPARQLQueryBuilderService } from "./sparql-query-builder.service";
import { SPARQLUpdateBuilderService } from "./sparql-update-builder.service";

type LinkedEntityInfo = {
  iri: string;
  graph: string;
};

type MusicEventCandidate = {
  iri: string;
  name: string;
  artists: {
    iri: string;
    name: string;
  }[];
  places: {
    iri: string;
    name: string;
    latitude: string;
    longitude: string;
    address: {
      iri: string;
      street?: string;
    };
  }[];
};

/**
 * SPARQL service realizes communication with RDF triple store.
 */
@Injectable()
export class SPARQLService {
  constructor(
    private readonly queryBuilder: SPARQLQueryBuilderService,
    private readonly updateBuilder: SPARQLUpdateBuilderService,
    @Inject(SPARQL_PROVIDERS.client) private readonly sparqlClient: ParsingClient
  ) {}

  insert(quads: Quad[], graphIRI: string | undefined) {
    const insertQuery = this.updateBuilder.insert(quads, graphIRI);
    return insertQuery?.execute(this.sparqlClient);
  }

  update(deleteQuads: Quad[], insertQuads: Quad[], graphIRI: string | undefined) {
    const deleteInsertQuery = this.updateBuilder.deleteInsert(deleteQuads, insertQuads, graphIRI);
    return deleteInsertQuery.execute(this.sparqlClient);
  }

  ask(rdfData: Quad[], graphIRI: string | undefined) {
    const askQuery = this.queryBuilder.ask(rdfData, graphIRI);
    return askQuery.execute(this.sparqlClient);
  }

  constructEntity(entityIRI: NamedNode, graphIRI: string | undefined) {
    const constructQuery = this.queryBuilder.constructEntity(entityIRI, graphIRI);
    return constructQuery.execute(this.sparqlClient);
  }

  insertLinks(sourceIRI: NamedNode, targetIRI: string, linksGraphIRI: string) {
    const insertQuery = this.updateBuilder.insertLinks(sourceIRI, targetIRI, linksGraphIRI);
    return insertQuery.execute(this.sparqlClient);
  }

  async getLinkedResources(resourceIRI: NamedNode, linksGraphIRI: string) {
    const selectQuery = this.queryBuilder.selectLinks(resourceIRI, linksGraphIRI);
    const results = await selectQuery.execute(this.sparqlClient);
    const VARIABLES = SPARQL_QUERY_BUILDER_VARIABLES.selectLinks;
    return results
      .map((row) => ({
        iri: row[VARIABLES.linkedResource.iri]?.value,
        graph: row[VARIABLES.linkedResource.graph]?.value,
      }))
      .filter((info): info is LinkedEntityInfo => Boolean(info.iri && info.graph));
  }

  async getMusicEventsByDate(startDate: Date, eventGraphIRI: string) {
    const selectQuery = this.queryBuilder.selectEventsByDate(startDate, eventGraphIRI);
    const results = await selectQuery.execute(this.sparqlClient);
    return this.#parseEventsByDateResults(results);
  }

  #parseEventsByDateResults(results: Record<string, Term>[]) {
    const eventMap = new Map<string, MusicEventCandidate>();
    const VARIABLES = SPARQL_QUERY_BUILDER_VARIABLES.selectEventsByDate;

    for (const row of results) {
      const eventIRI = row[VARIABLES.event.iri]?.value;
      if (!eventIRI) {
        continue;
      }

      let event = eventMap.get(eventIRI);
      if (!event) {
        event = {
          iri: eventIRI,
          name: row[VARIABLES.event.name]?.value!, // eslint-disable-line @typescript-eslint/no-non-null-asserted-optional-chain
          artists: [],
          places: [],
        };
        eventMap.set(eventIRI, event);
      }

      const artistIRI = row[VARIABLES.artist.iri]?.value;
      if (artistIRI) {
        const isArtistAdded = eventMap.get(eventIRI)?.artists.some((a) => a.iri === artistIRI);
        if (!isArtistAdded) {
          event.artists.push({
            iri: artistIRI,
            name: row[VARIABLES.artist.name]?.value!, // eslint-disable-line @typescript-eslint/no-non-null-asserted-optional-chain
          });
        }
      }

      const placeIRI = row[VARIABLES.place.iri]?.value;
      if (placeIRI) {
        const isPlaceAdded = eventMap.get(eventIRI)?.places.some((p) => p.iri === placeIRI);
        if (!isPlaceAdded) {
          event.places.push({
            iri: placeIRI,
            name: row[VARIABLES.place.name]?.value!, // eslint-disable-line @typescript-eslint/no-non-null-asserted-optional-chain
            latitude: row[VARIABLES.place.latitude]?.value!, // eslint-disable-line @typescript-eslint/no-non-null-asserted-optional-chain
            longitude: row[VARIABLES.place.longitude]?.value!, // eslint-disable-line @typescript-eslint/no-non-null-asserted-optional-chain
            address: {
              iri: row[VARIABLES.address.iri]?.value!, // eslint-disable-line @typescript-eslint/no-non-null-asserted-optional-chain
              street: row[VARIABLES.address.street]?.value,
            },
          });
        }
      }
    }

    return Array.from(eventMap.values());
  }

  async getArtistsByName(artistName: string, eventGraphIRI: string) {
    const selectQuery = this.queryBuilder.selectArtistsByName(artistName, eventGraphIRI);
    const results = await selectQuery.execute(this.sparqlClient);
    const VARIABLES = SPARQL_QUERY_BUILDER_VARIABLES.selectArtistsByName;
    return results.map((row) => ({
      iri: row[VARIABLES.artist.iri]?.value!, // eslint-disable-line @typescript-eslint/no-non-null-asserted-optional-chain
    }));
  }

  async getPlacesByCoords(latitude: number, longitude: number, eventGraphIRI: string) {
    const selectQuery = this.queryBuilder.selectPlacesByCoords(latitude, longitude, eventGraphIRI);
    const results = await selectQuery.execute(this.sparqlClient);
    const VARIABLES = SPARQL_QUERY_BUILDER_VARIABLES.selectPlacesByCoords;
    return results.map((row) => ({
      place: {
        iri: row[VARIABLES.place.iri]?.value!, // eslint-disable-line @typescript-eslint/no-non-null-asserted-optional-chain
        name: row[VARIABLES.place.name]?.value!, // eslint-disable-line @typescript-eslint/no-non-null-asserted-optional-chain
        address: {
          iri: row[VARIABLES.place.address.iri]?.value!, // eslint-disable-line @typescript-eslint/no-non-null-asserted-optional-chain
          street: row[VARIABLES.place.address.street]?.value,
        },
      },
    }));
  }
}
