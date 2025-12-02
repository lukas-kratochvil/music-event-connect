import { Injectable } from "@nestjs/common";
import type { ClassConstructor } from "class-transformer";
import { DataFactory, type NamedNode } from "n3";
import { MusicEventEntity } from "../entities";
import { AbstractMapper } from "./abstract-mapper.service";

@Injectable()
export class MusicEventMapper extends AbstractMapper<MusicEventEntity> {
  protected override getGraphIRI(): NamedNode {
    return DataFactory.namedNode("http://music-event-connect.cz/events/cze");
  }

  protected override getClassConstructor(): ClassConstructor<MusicEventEntity> {
    return MusicEventEntity;
  }
}
