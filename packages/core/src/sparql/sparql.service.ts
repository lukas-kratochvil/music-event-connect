import { Inject, Injectable } from "@nestjs/common";
import { DataFactory, type NamedNode, type Quad } from "n3";
import type { ParsingClient } from "sparql-http-client" with { "resolution-mode": "import" };
import { SPARQL_PROVIDERS } from "../constants";
import { ns } from "../rdf/ontology";
import { SPARQL_QUERY_BUILDER_VARIABLES, SPARQLQueryBuilderService } from "./sparql-query-builder.service";
import { SPARQLUpdateBuilderService } from "./sparql-update-builder.service";

const { namedNode, triple } = DataFactory;

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

  update(deleteSourceIRI: NamedNode, insertQuads: Quad[], graphIRI: string | undefined) {
    const deleteInsertQuery = this.updateBuilder.deleteInsert(deleteSourceIRI, insertQuads, graphIRI);
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

  insertLinks(links: [NamedNode, string][], linksGraphIRI: string) {
    const sameAs = namedNode(ns.schema.sameAs);
    const quads = links
      .map(([source, targetIRI]) => {
        const target = namedNode(targetIRI);
        // insert `sameAs` links in both directions
        return [triple(source, sameAs, target), triple(target, sameAs, source)];
      })
      .flat();
    const insertQuery = this.updateBuilder.insert(quads, linksGraphIRI);
    return insertQuery?.execute(this.sparqlClient);
  }

  async getLinkedResources(sourceIRI: NamedNode, linksGraphIRI: string) {
    const selectQuery = this.queryBuilder.selectLinks(sourceIRI, linksGraphIRI);
    const results = await selectQuery.execute(this.sparqlClient);
    const VARIABLES = SPARQL_QUERY_BUILDER_VARIABLES.selectLinks;
    return results.map((row) => ({
      iri: row[VARIABLES.linkedResource.iri]?.value!, // eslint-disable-line @typescript-eslint/no-non-null-asserted-optional-chain
      graph: row[VARIABLES.linkedResource.graph]?.value!, // eslint-disable-line @typescript-eslint/no-non-null-asserted-optional-chain
    }));
  }

  async getEventsByDate(startDate: Date, eventGraphIRI: string) {
    const selectQuery = this.queryBuilder.selectEventEntitiesByDate(startDate, eventGraphIRI);
    const results = await selectQuery.execute(this.sparqlClient);
    const VARIABLES = SPARQL_QUERY_BUILDER_VARIABLES.selectEventsByDate;
    return results.map((row) => ({
      iri: row[VARIABLES.event.iri]?.value!, // eslint-disable-line @typescript-eslint/no-non-null-asserted-optional-chain
      name: row[VARIABLES.event.name]?.value!, // eslint-disable-line @typescript-eslint/no-non-null-asserted-optional-chain
    }));
  }

  async getMusicBrainzEventsByDate(startDate: Date, musicBrainzGraphIRI: string) {
    const selectQuery = this.queryBuilder.selectMusicBrainzEventsByDate(startDate, musicBrainzGraphIRI);
    const results = await selectQuery.execute(this.sparqlClient);
    const VARIABLES = SPARQL_QUERY_BUILDER_VARIABLES.selectEventsByDate;
    return results.map((row) => ({
      iri: row[VARIABLES.event.iri]?.value!, // eslint-disable-line @typescript-eslint/no-non-null-asserted-optional-chain
      name: row[VARIABLES.event.name]?.value!, // eslint-disable-line @typescript-eslint/no-non-null-asserted-optional-chain
    }));
  }

  async getArtistsByName(artistName: string, eventGraphIRI: string) {
    const selectQuery = this.queryBuilder.selectArtistEntitiesByName(artistName, eventGraphIRI);
    const results = await selectQuery.execute(this.sparqlClient);
    const VARIABLES = SPARQL_QUERY_BUILDER_VARIABLES.selectArtistsByName;
    return results.map((row) => ({
      iri: row[VARIABLES.artist.iri]?.value!, // eslint-disable-line @typescript-eslint/no-non-null-asserted-optional-chain
    }));
  }

  async getMusicBrainzArtistsByName(artistName: string, musicBrainzGraphIRI: string) {
    const selectQuery = this.queryBuilder.selectMusicBrainzArtistsByName(artistName, musicBrainzGraphIRI);
    const results = await selectQuery.execute(this.sparqlClient);
    const VARIABLES = SPARQL_QUERY_BUILDER_VARIABLES.selectArtistsByName;
    return results.map((row) => ({
      iri: row[VARIABLES.artist.iri]?.value!, // eslint-disable-line @typescript-eslint/no-non-null-asserted-optional-chain
    }));
  }

  async getPlacesByCoords(latitude: number, longitude: number, eventGraphIRI: string) {
    const selectQuery = this.queryBuilder.selectPlaceEntitiesByCoords(latitude, longitude, eventGraphIRI);
    const results = await selectQuery.execute(this.sparqlClient);
    const VARIABLES = SPARQL_QUERY_BUILDER_VARIABLES.selectPlacesByCoords;
    return results.map((row) => ({
      place: {
        iri: row[VARIABLES.place.iri]?.value!, // eslint-disable-line @typescript-eslint/no-non-null-asserted-optional-chain
        name: row[VARIABLES.place.name]?.value!, // eslint-disable-line @typescript-eslint/no-non-null-asserted-optional-chain
        address: row[VARIABLES.place.address.iri]?.value
          ? {
              iri: row[VARIABLES.place.address.iri]?.value!, // eslint-disable-line @typescript-eslint/no-non-null-asserted-optional-chain
              street: row[VARIABLES.place.address.street]?.value,
            }
          : undefined,
      },
    }));
  }

  async getMusicBrainzPlacesByCoords(latitude: number, longitude: number, musicBrainzGraphIRI: string) {
    const selectQuery = this.queryBuilder.selectMusicBrainzPlacesByCoords(latitude, longitude, musicBrainzGraphIRI);
    const results = await selectQuery.execute(this.sparqlClient);
    const VARIABLES = SPARQL_QUERY_BUILDER_VARIABLES.selectPlacesByCoords;
    return results.map((row) => ({
      place: {
        iri: row[VARIABLES.place.iri]?.value!, // eslint-disable-line @typescript-eslint/no-non-null-asserted-optional-chain
        name: row[VARIABLES.place.name]?.value!, // eslint-disable-line @typescript-eslint/no-non-null-asserted-optional-chain
        address: undefined,
      },
    }));
  }
}
