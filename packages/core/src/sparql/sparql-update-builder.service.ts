import { Inject, Injectable } from "@nestjs/common";
import { DataFactory, type NamedNode, type Quad } from "n3";
import { SPARQL_PROVIDERS } from "../constants";
import type { SparqlBuilderType } from "./util";

const { namedNode, variable } = DataFactory;

/**
 * SPARQL service for building [SPARQL 1.1 Update](https://www.w3.org/TR/2013/REC-sparql11-update-20130321/) operations.
 */
@Injectable()
export class SPARQLUpdateBuilderService {
  constructor(@Inject(SPARQL_PROVIDERS.builder) private readonly builder: SparqlBuilderType) {}

  /**
   * Creates SPARQL INSERT query. Returns undefined if no quads present.
   */
  insert(quads: Quad[], graphIRI: string | undefined) {
    if (quads.length === 0) {
      return undefined;
    }

    // named graph
    if (graphIRI) {
      return this.builder.INSERT.DATA`
        GRAPH ${namedNode(graphIRI)} {
          ${quads}
        }
      `;
    }

    // default graph
    return this.builder.INSERT.DATA`
      ${quads}
    `;
  }

  /**
   * Creates SPARQL DELETE query.
   *
   * Deletes all triples given by the quads pattern from the specified graph.
   */
  delete(quads: Quad[], graphIRI: string | undefined) {
    if (quads.length === 0) {
      return undefined;
    }

    // named graph
    if (graphIRI) {
      const graphTemplate = this.builder.sparql`
        GRAPH ${namedNode(graphIRI)} {
          ${quads}
        }
      `;
      return this.builder.DELETE`${graphTemplate}`.WHERE`${graphTemplate}`;
    }

    // default graph
    return this.builder.DELETE`${quads}`.WHERE`${quads}`;
  }

  /**
   * Creates an atomic SPARQL DELETE/INSERT query (UPSERT).
   *
   * Deletes only the direct properties of the `deleteSourceIRI`, preserving nested entities, and inserts the updated properties.
   */
  deleteInsert(deleteSourceIRI: NamedNode, insertQuads: Quad[], graphIRI: string | undefined) {
    const p = variable("p");
    const o = variable("o");
    const query = this.builder.DELETE`${deleteSourceIRI} ${p} ${o}`.INSERT`${insertQuads}`
      .WHERE`${deleteSourceIRI} ${p} ${o}`;
    return graphIRI ? this.builder.WITH(namedNode(graphIRI), query) : query;
  }
}
