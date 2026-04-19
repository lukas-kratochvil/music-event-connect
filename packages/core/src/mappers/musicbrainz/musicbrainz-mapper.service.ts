import { Inject, Injectable } from "@nestjs/common";
import { SPARQLService } from "../../sparql/sparql.service";
import { GRAPHS_MAP } from "../../utils";

@Injectable()
export class MusicBrainzMapper {
  @Inject(SPARQLService)
  private readonly sparqlService: SPARQLService;

  async findGenres() {
    const results = await this.sparqlService.getMusicBrainzGenres(GRAPHS_MAP.musicBrainz);
    return results.map(({ genre }) => ({
      iri: genre.iri,
      name: genre.name,
    }));
  }
}
