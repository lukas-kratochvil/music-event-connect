import { Inject, Injectable } from "@nestjs/common";
import type { MusicEventEntity } from "../../entities";
import { SPARQLService } from "../../sparql/sparql.service";

@Injectable()
export class LinksMapper {
  @Inject(SPARQLService)
  private readonly sparqlService: SPARQLService;

  async createLinks(musicEvent: MusicEventEntity) {
  }
}
