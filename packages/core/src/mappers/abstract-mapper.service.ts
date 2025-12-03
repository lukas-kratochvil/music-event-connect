import { Inject } from "@nestjs/common";
import type { ClassConstructor } from "class-transformer";
import type { NamedNode } from "n3";
import type { AbstractEntity } from "../entities/abstract.entity";
import { RdfEntitySerializerService } from "../serialization/rdf-entity-serializer.service";
import { SPARQLService } from "../sparql/sparql.service";

export abstract class AbstractMapper<TEntity extends AbstractEntity> {
  @Inject(RdfEntitySerializerService)
  private readonly serializer: RdfEntitySerializerService;

  @Inject(SPARQLService)
  private readonly sparqlService: SPARQLService;

  protected abstract getGraphIRI(): NamedNode;

  protected abstract getClassConstructor(): ClassConstructor<TEntity>;

  private createNewEntity() {
    const cls = this.getClassConstructor();
    return new cls();
  }

  create(entity: TEntity) {
    const rdfData = this.serializer.serialize(entity);
    return this.sparqlService.insert(rdfData, this.getGraphIRI());
  }

  exists(id: string) {
    const entity = this.createNewEntity();
    entity.id = id;
    const rdfData = this.serializer.serialize(entity);
    return this.sparqlService.ask(rdfData, this.getGraphIRI());
  }
}
