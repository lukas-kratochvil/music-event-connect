import { Inject, Injectable } from "@nestjs/common";
import type { NamedNode, Quad } from "n3";
import { SPARQL_PROVIDERS } from "../constants";
import type { SparqlBuilderType } from "./util";

/**
 * SPARQL service for building [SPARQL 1.1 Update](https://www.w3.org/TR/2013/REC-sparql11-update-20130321/) queries.
 */
@Injectable()
export class SPARQLUpdateBuilderService {
  constructor(@Inject(SPARQL_PROVIDERS.builder) private readonly builder: SparqlBuilderType) {}

  /**
   * Creates SPARQL INSERT query. Returns undefined if no quads present.
   */
  insert(quads: Quad[], graphIRI: NamedNode | undefined) {
    if (quads.length === 0) {
      return undefined;
    }

    // named graph
    if (graphIRI) {
      return this.builder.INSERT.DATA`
        GRAPH ${graphIRI} {
          ${quads}
        }
      `;
    }

    // default graph
    return this.builder.INSERT.DATA`
      ${quads}
    `;
  }
}
