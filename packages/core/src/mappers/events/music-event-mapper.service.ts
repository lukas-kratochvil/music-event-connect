import { Injectable } from "@nestjs/common";
import type { ClassConstructor } from "class-transformer";
import { DataFactory, type NamedNode } from "n3";
import { MusicEventEntity } from "../../entities";
import { RDF_METADATA_KEYS } from "../../rdf/decorators/metadata-keys";
import { ns } from "../../rdf/ontology";
import type {
  ConstructEventsFilters,
  ConstructEventsSorters,
  Pagination,
} from "../../sparql/sparql-query-builder.service";
import { GRAPHS_MAP } from "../../utils/graphs";
import { AbstractEntityMapper } from "./abstract-entity-mapper.service";

const { namedNode } = DataFactory;

@Injectable()
export class MusicEventMapper extends AbstractEntityMapper<MusicEventEntity> {
  protected override getClassConstructor(): ClassConstructor<MusicEventEntity> {
    return MusicEventEntity;
  }

  async findAll(
    pagination: Pagination,
    filters: ConstructEventsFilters | undefined,
    sorters: ConstructEventsSorters | undefined
  ) {
    const eventClassIRI = Reflect.getMetadata(RDF_METADATA_KEYS.class, this.getClassConstructor());
    const dataset = await this.sparqlService.constructEvents(
      eventClassIRI,
      GRAPHS_MAP.links,
      pagination,
      filters,
      sorters
    );
    const eventIRIQuads = dataset.match(null, namedNode(ns.rdf.type), eventClassIRI);
    const musicEventEntities: MusicEventEntity[] = [];

    for (const quad of eventIRIQuads) {
      const eventIRI = quad.subject as NamedNode;
      const musicEventEntity = this.deserializer.deserialize(this.getClassConstructor(), eventIRI, dataset);
      musicEventEntities.push(musicEventEntity);
    }

    return musicEventEntities;
  }
}
