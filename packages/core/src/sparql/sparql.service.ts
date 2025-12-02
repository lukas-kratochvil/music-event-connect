import { Inject, Injectable, Logger } from "@nestjs/common";
import type { NamedNode, Quad } from "n3";
import type StreamClient from "sparql-http-client" with { "resolution-mode": "import" };
import { SPARQL_PROVIDERS } from "../constants";
import { SPARQLQueryBuilderService } from "./sparql-query-builder.service";

/**
 * SPARQL service realizes communication with RDF triple store.
 */
@Injectable()
export class SPARQLService {
  readonly #logger = new Logger(SPARQLService.name);

  constructor(
    private readonly queryBuilder: SPARQLQueryBuilderService,
    @Inject(SPARQL_PROVIDERS.client) private readonly sparqlClient: StreamClient
  ) {}

  ask(rdfData: Quad[], graphIRI: NamedNode | undefined) {
    const askQuery = this.queryBuilder.ask(rdfData, graphIRI);
    return askQuery.execute(this.sparqlClient);
  }
}
