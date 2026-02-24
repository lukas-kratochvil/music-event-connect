import { Injectable } from "@nestjs/common";
import type { ClassConstructor } from "class-transformer";
import { MusicEventEntity } from "../entities";
import { AbstractMapper } from "./abstract-mapper.service";

@Injectable()
export class MusicEventMapper extends AbstractMapper<MusicEventEntity> {
  protected override getClassConstructor(): ClassConstructor<MusicEventEntity> {
    return MusicEventEntity;
  }
}
