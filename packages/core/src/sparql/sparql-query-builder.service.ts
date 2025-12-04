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
    const query = this.builder.ASK`${quads}`;
    return graphIRI ? query.FROM(graphIRI) : query;
  }

  /**
   * Constructs entity and also retrieves its nested objects max. 2 levels deep.
   */
  constructEntity(entityIRI: NamedNode, graphIRI: NamedNode | undefined) {
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
    return graphIRI ? query.FROM(graphIRI) : query;
  }
}
