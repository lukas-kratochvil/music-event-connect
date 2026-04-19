import type { ItemAvailability } from "@music-event-connect/shared/interfaces";
import { Injectable } from "@nestjs/common";
import type { ClassConstructor } from "class-transformer";
import { compareAsc, compareDesc } from "date-fns";
import { DataFactory, type NamedNode } from "n3";
import { MusicEventEntity } from "../../entities";
import { RDF_METADATA_KEYS } from "../../rdf/decorators/metadata-keys";
import { ns } from "../../rdf/ontology";
import { RdfEntitySerializerService } from "../../serialization/rdf-entity-serializer.service";
import type {
  ConstructEventsFilters,
  ConstructEventsSorters,
  Pagination,
} from "../../sparql/sparql-query-builder.service";
import { validateEntity } from "../../utils/entity";
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
    const eventTypeIRIStr = Reflect.getMetadata(RDF_METADATA_KEYS.class, this.getClassConstructor()) as string;
    const eventTypeIRI = namedNode(eventTypeIRIStr);
    const dataset = await this.sparqlService.constructEvents(
      eventTypeIRI,
      GRAPHS_MAP.links,
      pagination,
      filters,
      sorters
    );
    const eventIRIQuads = dataset.match(null, namedNode(ns.rdf.type), eventTypeIRI);
    const musicEventEntities: MusicEventEntity[] = [];

    for (const quad of eventIRIQuads) {
      const eventIRI = quad.subject as NamedNode;
      const musicEventEntity = this.deserializer.deserialize(this.getClassConstructor(), eventIRI, dataset);
      const validationErrors = await validateEntity(musicEventEntity);
      if (validationErrors.length === 0) {
        musicEventEntities.push(musicEventEntity);
      }
    }

    if (sorters) {
      const { startDate } = sorters;
      if (startDate) {
        return musicEventEntities.toSorted((a, b) =>
          startDate.desc ? compareDesc(a.startDate, b.startDate) : compareAsc(a.startDate, b.startDate)
        );
      }
    }

    return musicEventEntities;
  }

  async findAllRelatedTickets(eventIds: string[]) {
    const eventIRIs = eventIds.map((id) => {
      const entity = this.createNewEntity(id);
      return RdfEntitySerializerService.createEntityIRI(entity);
    });
    const linkedEventOffers = await this.sparqlService.getLinkedEventOffers(eventIRIs, GRAPHS_MAP.links);
    return linkedEventOffers.map(
      (linkedData) =>
        ({
          event: {
            id: linkedData.event.id,
            offer: {
              url: linkedData.event.offer.url,
              availability: new URL(linkedData.event.offer.availability).pathname.split("/").at(-1) as ItemAvailability,
            },
          },
        }) satisfies (typeof linkedEventOffers)[number]
    );
  }
}
