import { Inject, Injectable } from "@nestjs/common";
import type { NamedNode, Quad } from "n3";
import { SPARQL_PROVIDERS } from "../constants";
import type { SparqlBuilderType } from "./util";

/**
 * SPARQL service for building [SPARQL 1.1 Query Language](http://www.w3.org/TR/2013/REC-sparql11-query-20130321/) queries.
 */
@Injectable()
export class SPARQLQueryBuilderService {
  constructor(@Inject(SPARQL_PROVIDERS.builder) private readonly builder: SparqlBuilderType) {}

  ask(quads: Quad[], graphIRI: NamedNode | undefined) {
    // named graph
    if (graphIRI) {
      return this.builder.ASK`
        GRAPH ${graphIRI} {
          ${quads}
        }
      `;
    }

    // default graph
    return this.builder.ASK`
      ${quads}
    `;
  }
}
