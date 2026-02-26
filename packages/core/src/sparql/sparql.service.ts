import { Inject, Injectable } from "@nestjs/common";
import type { NamedNode, Quad } from "n3";
import type { ParsingClient } from "sparql-http-client" with { "resolution-mode": "import" };
import { SPARQL_PROVIDERS } from "../constants";
import { SPARQLQueryBuilderService } from "./sparql-query-builder.service";
import { SPARQLUpdateBuilderService } from "./sparql-update-builder.service";

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
}
