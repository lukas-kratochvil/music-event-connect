import { Inject } from "@nestjs/common";
import type { ClassConstructor } from "class-transformer";
import type { NamedNode } from "n3";
import type { AbstractEntity } from "../entities/abstract.entity";
import { RdfEntityDeserializerService } from "../serialization/rdf-entity-deserializer.service";
import { RdfEntitySerializerService } from "../serialization/rdf-entity-serializer.service";
import { SPARQLService } from "../sparql/sparql.service";

export abstract class AbstractMapper<TEntity extends AbstractEntity> {
  @Inject(RdfEntitySerializerService)
  private readonly serializer: RdfEntitySerializerService;

  @Inject(RdfEntityDeserializerService)
  private readonly deserializer: RdfEntityDeserializerService;

  @Inject(SPARQLService)
  private readonly sparqlService: SPARQLService;

  protected abstract getGraphIRI(): NamedNode;

  protected abstract getClassConstructor(): ClassConstructor<TEntity>;

  private createNewEntity(id: string) {
    const cls = this.getClassConstructor();
    const entity = new cls();
    entity.id = id;
    return entity;
  }

  create(entity: TEntity) {
    const quads = this.serializer.serialize(entity);
    return this.sparqlService.insert(quads, this.getGraphIRI());
  }

  update(deleteEntity: TEntity, insertEntity: TEntity) {
    const deleteQuads = this.serializer.serialize(deleteEntity);
    const insertQuads = this.serializer.serialize(insertEntity);
    return this.sparqlService.update(deleteQuads, insertQuads, this.getGraphIRI());
  }

  exists(id: string) {
    const entity = this.createNewEntity(id);
    const quads = this.serializer.serialize(entity);
    return this.sparqlService.ask(quads, this.getGraphIRI());
  }

  async getWholeEntity(id: string) {
    const entity = this.createNewEntity(id);
    const entityIRI = RdfEntitySerializerService.createEntityIRI(entity);
    const dataset = await this.sparqlService.constructEntity(entityIRI, this.getGraphIRI());
    return this.deserializer.deserialize(this.getClassConstructor(), entityIRI, dataset);
  }
}
