import { Injectable } from "@nestjs/common";
import type { ClassConstructor } from "class-transformer";
import { MusicEventEntity } from "../entities";
import { AbstractEntityMapper } from "./abstract-entity-mapper.service";

@Injectable()
export class MusicEventMapper extends AbstractEntityMapper<MusicEventEntity> {
  protected override getClassConstructor(): ClassConstructor<MusicEventEntity> {
    return MusicEventEntity;
  }
}
