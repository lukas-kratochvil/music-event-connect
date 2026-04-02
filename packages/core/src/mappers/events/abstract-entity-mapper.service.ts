import { Inject } from "@nestjs/common";
import type { ClassConstructor } from "class-transformer";
import type { AbstractEntity } from "../../entities/abstract.entity";
import { RdfEntityDeserializerService } from "../../serialization/rdf-entity-deserializer.service";
import { RdfEntitySerializerService } from "../../serialization/rdf-entity-serializer.service";
import { SPARQLService } from "../../sparql/sparql.service";
import type { MusicEventGraph } from "../../utils";
import { LinksMapper } from "../links/links-mapper.service";

export abstract class AbstractEntityMapper<TEntity extends AbstractEntity> {
  @Inject(RdfEntitySerializerService)
  protected readonly serializer: RdfEntitySerializerService;

  @Inject(RdfEntityDeserializerService)
  protected readonly deserializer: RdfEntityDeserializerService;

  @Inject(SPARQLService)
  protected readonly sparqlService: SPARQLService;

  @Inject(LinksMapper)
  protected readonly linksMapper: LinksMapper;

  protected abstract getClassConstructor(): ClassConstructor<TEntity>;

  protected createNewEntity(id: string) {
    const cls = this.getClassConstructor();
    const entity = new cls();
    entity.id = id;
    return entity;
  }

  async create(entity: TEntity, graphIri: MusicEventGraph) {
    const quads = this.serializer.serialize(entity);
    const insertResult = await this.sparqlService.insert(quads, graphIri);
    await this.linksMapper.createEntityLinks(entity, graphIri);
    return insertResult;
  }

  async update(deleteEntity: TEntity, insertEntity: TEntity, graphIri: MusicEventGraph) {
    const deleteSourceIRI = RdfEntitySerializerService.createEntityIRI(deleteEntity);
    const insertQuads = this.serializer.serialize(insertEntity);
    const updateResult = await this.sparqlService.update(deleteSourceIRI, insertQuads, graphIri);
    await this.linksMapper.createEntityLinks(insertEntity, graphIri);
    return updateResult;
  }

  exists(id: string, graphIri: MusicEventGraph) {
    const entity = this.createNewEntity(id);
    const quads = this.serializer.serialize(entity);
    return this.sparqlService.ask(quads, graphIri);
  }

  async getWholeEntity(id: string, graphIri: MusicEventGraph) {
    const entity = this.createNewEntity(id);
    const entityIRI = RdfEntitySerializerService.createEntityIRI(entity);
    const dataset = await this.sparqlService.constructEntity(entityIRI, graphIri);
    return this.deserializer.deserialize(this.getClassConstructor(), entityIRI, dataset);
  }
}
