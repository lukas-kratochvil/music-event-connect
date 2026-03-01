import { Inject, Injectable } from "@nestjs/common";
import type { NamedNode } from "n3";
import { stringSimilarity } from "string-similarity-js";
import type { MusicEventEntity } from "../../entities";
import { RdfEntitySerializerService } from "../../serialization/rdf-entity-serializer.service";
import { SPARQLService } from "../../sparql/sparql.service";
import { ALL_GRAPHS_MAP, getMusicEventIdPrefix, MUSIC_EVENT_GRAPHS, REVERSED_MUSIC_EVENT_ID_MAPPER } from "../../utils";

@Injectable()
export class LinksMapper {
  @Inject(SPARQLService)
  private readonly sparqlService: SPARQLService;

  async #getEntityMissingLinkGraphs(iri: NamedNode, sourceGraph: (typeof MUSIC_EVENT_GRAPHS)[number]) {
    const linkedResources = await this.sparqlService.getLinkedResources(iri, ALL_GRAPHS_MAP.links);
    const connectedGraphIRIs = linkedResources.map((link) => link.graph);
    return MUSIC_EVENT_GRAPHS.filter((graphIRI) => !connectedGraphIRIs.includes(graphIRI) && graphIRI !== sourceGraph);
  }

  async createLinks(event: MusicEventEntity) {
    const sourceGraph = ALL_GRAPHS_MAP.events[REVERSED_MUSIC_EVENT_ID_MAPPER[getMusicEventIdPrefix(event.id)]];

    // match MusicEvent
    const eventIRI = RdfEntitySerializerService.createEntityIRI(event);
    const eventMissingGraphs = await this.#getEntityMissingLinkGraphs(eventIRI, sourceGraph);

    for (const targetGraphIRI of eventMissingGraphs) {
      const bestEventCandidateMatch = await this.#findBestEventCandidateMatch(event, targetGraphIRI);
      if (bestEventCandidateMatch) {
        await this.sparqlService.insertLinks(eventIRI, bestEventCandidateMatch.iri, ALL_GRAPHS_MAP.links);
      }
    }

    // match MusicGroup
    for (const artist of event.artists) {
      const artistIRI = RdfEntitySerializerService.createEntityIRI(artist);
      const artistMissingGraphs = await this.#getEntityMissingLinkGraphs(artistIRI, sourceGraph);
      for (const targetGraphIRI of artistMissingGraphs) {
        const candidates = await this.sparqlService.getArtistsByName(artist.name, targetGraphIRI);
        await Promise.all(
          candidates.map((candidate) => this.sparqlService.insertLinks(artistIRI, candidate.iri, ALL_GRAPHS_MAP.links))
        );
      }
    }

    // TODO: match Place and PostalAddress

    // TODO: match MusicBrainz entities
  }

  async #findBestEventCandidateMatch(event: MusicEventEntity, targetGraphIRI: string) {
    const candidates = await this.sparqlService.getMusicEventsByDate(event.startDate, targetGraphIRI);

    if (candidates.length === 0) {
      return;
    }

    let bestResult = {
      score: 0,
      candidate: candidates.at(0)!,
    };
    const eventName = event.name.toLowerCase().trim();
    candidates.forEach((candidate) => {
      const candidateName = candidate.name.toLowerCase().trim();
      const score = stringSimilarity(eventName, candidateName);
      if (score > bestResult.score) {
        bestResult = {
          score,
          candidate,
        };
      }
    });
    return bestResult.score >= 0.9 ? bestResult.candidate : undefined;
  }
  }
}
