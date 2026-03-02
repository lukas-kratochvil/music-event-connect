import { Inject } from "@nestjs/common";
import type { ClassConstructor } from "class-transformer";
import type { AbstractEntity } from "../../entities/abstract.entity";
import { RdfEntityDeserializerService } from "../../serialization/rdf-entity-deserializer.service";
import { RdfEntitySerializerService } from "../../serialization/rdf-entity-serializer.service";
import { SPARQLService } from "../../sparql/sparql.service";
import { LinksMapper } from "../links/links-mapper.service";

export abstract class AbstractEntityMapper<TEntity extends AbstractEntity> {
  @Inject(RdfEntitySerializerService)
  private readonly serializer: RdfEntitySerializerService;

  @Inject(RdfEntityDeserializerService)
  private readonly deserializer: RdfEntityDeserializerService;

  @Inject(SPARQLService)
  private readonly sparqlService: SPARQLService;

  @Inject(LinksMapper)
  private readonly linksMapper: LinksMapper;

  protected abstract getClassConstructor(): ClassConstructor<TEntity>;

  private createNewEntity(id: string) {
    const cls = this.getClassConstructor();
    const entity = new cls();
    entity.id = id;
    return entity;
  }

  async create(entity: TEntity, graphIri: string) {
    const quads = this.serializer.serialize(entity);
    const insertionResult = await this.sparqlService.insert(quads, graphIri);
    await this.linksMapper.createLinks(entity);
    return insertionResult;
  }

  update(deleteEntity: TEntity, insertEntity: TEntity, graphIri: string) {
    // FIXME: cannot delete entities - they can be in multiple relationships
    const deleteQuads = this.serializer.serialize(deleteEntity);
    const insertQuads = this.serializer.serialize(insertEntity);
    // TODO: update/create links
    return this.sparqlService.update(deleteQuads, insertQuads, graphIri);
  }

  exists(id: string, graphIri: string) {
    const entity = this.createNewEntity(id);
    const quads = this.serializer.serialize(entity);
    return this.sparqlService.ask(quads, graphIri);
  }

  async getWholeEntity(id: string, graphIri: string) {
    const entity = this.createNewEntity(id);
    const entityIRI = RdfEntitySerializerService.createEntityIRI(entity);
    const dataset = await this.sparqlService.constructEntity(entityIRI, graphIri);
    return this.deserializer.deserialize(this.getClassConstructor(), entityIRI, dataset);
  }
}
