import { Inject } from "@nestjs/common";
import type { ClassConstructor } from "class-transformer";
import type { AbstractEntity } from "../../entities/abstract.entity";
import { RdfEntityDeserializerService } from "../../serialization/rdf-entity-deserializer.service";
import { RdfEntitySerializerService } from "../../serialization/rdf-entity-serializer.service";
import { SPARQLService } from "../../sparql/sparql.service";

export abstract class AbstractEntityMapper<TEntity extends AbstractEntity> {
  @Inject(RdfEntitySerializerService)
  private readonly serializer: RdfEntitySerializerService;

  @Inject(RdfEntityDeserializerService)
  private readonly deserializer: RdfEntityDeserializerService;

  @Inject(SPARQLService)
  private readonly sparqlService: SPARQLService;

  protected abstract getClassConstructor(): ClassConstructor<TEntity>;

  private createNewEntity(id: string) {
    const cls = this.getClassConstructor();
    const entity = new cls();
    entity.id = id;
    return entity;
  }

  create(entity: TEntity, graphIri: string) {
    const quads = this.serializer.serialize(entity);
    return this.sparqlService.insert(quads, graphIri);
  }

  update(deleteEntity: TEntity, insertEntity: TEntity, graphIri: string) {
    const deleteQuads = this.serializer.serialize(deleteEntity);
    const insertQuads = this.serializer.serialize(insertEntity);
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
