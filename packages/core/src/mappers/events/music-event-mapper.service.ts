import { Inject, Injectable } from "@nestjs/common";
import type { ClassConstructor } from "class-transformer";
import { MusicEventEntity } from "../../entities";
import { LinksMapper } from "../links/links-mapper.service";
import { AbstractEntityMapper } from "./abstract-entity-mapper.service";

@Injectable()
export class MusicEventMapper extends AbstractEntityMapper<MusicEventEntity> {
  @Inject(LinksMapper)
  private readonly linksMapper: LinksMapper;

  protected override getClassConstructor(): ClassConstructor<MusicEventEntity> {
    return MusicEventEntity;
  }

  override async create(entity: MusicEventEntity, graphIri: string) {
    await super.create(entity, graphIri);
    await this.linksMapper.createLinks(entity);
  }
}
