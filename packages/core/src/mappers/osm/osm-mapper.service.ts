import type { SpotNearby } from "@music-event-connect/shared/api";
import { Inject, Injectable } from "@nestjs/common";
import { SPARQLService } from "../../sparql/sparql.service";
import { GRAPHS_MAP } from "../../utils";

@Injectable()
export class OSMMapper {
  @Inject(SPARQLService)
  private readonly sparqlService: SPARQLService;

  async findSpotsNearby(latitude: number, longitude: number, limit: { min: number; max: number }) {
    const results = await this.sparqlService.getSpotsNearby(latitude, longitude, GRAPHS_MAP.osm.cze, limit);
    return results.map(({ spot }) => ({
      name: spot.name,
      type: spot.type as SpotNearby,
      latitude: +spot.latitude,
      longitude: +spot.longitude,
      distInM: +spot.distInM,
    }));
  }
}
