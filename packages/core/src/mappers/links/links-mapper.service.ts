import { Inject, Injectable, Logger } from "@nestjs/common";
import type { NamedNode } from "n3";
import { stringSimilarity } from "string-similarity-js";
import { AbstractEntity, ArtistEntity, MusicEventEntity, VenueEntity } from "../../entities";
import { RdfEntitySerializerService } from "../../serialization/rdf-entity-serializer.service";
import { SPARQLService } from "../../sparql/sparql.service";
import { ALL_GRAPHS_MAP, getMusicEventIdPrefix, MUSIC_EVENT_GRAPHS, REVERSED_MUSIC_EVENT_ID_MAPPER } from "../../utils";

const MIN_SIMILARITY_SCORE = 0.9;

@Injectable()
export class LinksMapper {
  @Inject(SPARQLService)
  private readonly sparqlService: SPARQLService;

  readonly #logger = new Logger(LinksMapper.name);

  async #getEntityMissingLinkGraphs(iri: NamedNode, sourceGraph: (typeof MUSIC_EVENT_GRAPHS)[number]) {
    const linkedResources = await this.sparqlService.getLinkedResources(iri, ALL_GRAPHS_MAP.links);
    const connectedGraphIRIs = linkedResources.map((link) => link.graph);
    return MUSIC_EVENT_GRAPHS.filter((graphIRI) => !connectedGraphIRIs.includes(graphIRI) && graphIRI !== sourceGraph);
  }

  // TODO: match MusicBrainz entities
  async createLinks<TEntity extends AbstractEntity>(entity: TEntity) {
    const sourceGraph = ALL_GRAPHS_MAP.events[REVERSED_MUSIC_EVENT_ID_MAPPER[getMusicEventIdPrefix(entity.id)]];

    if (entity instanceof MusicEventEntity) {
      // match MusicEvent
      const eventIRI = RdfEntitySerializerService.createEntityIRI(entity);
      const eventMissingGraphs = await this.#getEntityMissingLinkGraphs(eventIRI, sourceGraph);

      for (const targetGraphIRI of eventMissingGraphs) {
        const bestEventCandidate = await this.#findBestEventCandidate(entity, targetGraphIRI);
        if (bestEventCandidate) {
          await this.sparqlService.insertLinks(eventIRI, bestEventCandidate.iri, ALL_GRAPHS_MAP.links);
          this.#logger.log(
            `Link created between events: ${eventIRI.value} (${sourceGraph}) <--> ${bestEventCandidate.iri} (${targetGraphIRI})`
          );
        }
      }

      // match related entities
      await Promise.all([
        ...entity.artists.map((artist) => this.createLinks(artist)),
        ...entity.venues.map((venue) => this.createLinks(venue)),
      ]);
    } else if (entity instanceof ArtistEntity) {
      // match MusicGroup
      const artistIRI = RdfEntitySerializerService.createEntityIRI(entity);
      const artistMissingGraphs = await this.#getEntityMissingLinkGraphs(artistIRI, sourceGraph);
      for (const targetGraphIRI of artistMissingGraphs) {
        const candidates = await this.sparqlService.getArtistsByName(entity.name, targetGraphIRI);
        await Promise.all(
          candidates.map(async (candidate) => {
            await this.sparqlService.insertLinks(artistIRI, candidate.iri, ALL_GRAPHS_MAP.links);
            this.#logger.log(
              `Link created between artists: ${artistIRI.value} (${sourceGraph}) <--> ${candidate.iri} (${targetGraphIRI})`
            );
          })
        );
      }
    } else if (entity instanceof VenueEntity) {
      // match Place and PostalAddress
      const venueIRI = RdfEntitySerializerService.createEntityIRI(entity);
      const addressIRI = RdfEntitySerializerService.createEntityIRI(entity.address);
      const venueMissingGraphs = await this.#getEntityMissingLinkGraphs(venueIRI, sourceGraph);

      for (const targetGraphIRI of venueMissingGraphs) {
        const candidates = await this.sparqlService.getPlacesByCoords(
          entity.latitude,
          entity.longitude,
          targetGraphIRI
        );

        for (const { place } of candidates) {
          const venueNameSimilarityScore = stringSimilarity(entity.name, place.name);
          if (venueNameSimilarityScore >= MIN_SIMILARITY_SCORE) {
            await this.sparqlService.insertLinks(venueIRI, place.iri, ALL_GRAPHS_MAP.links);
            this.#logger.log(
              `Link created between venues: ${venueIRI.value} (${sourceGraph}) <--> ${place.iri} (${targetGraphIRI})`
            );
            await this.sparqlService.insertLinks(addressIRI, place.address.iri, ALL_GRAPHS_MAP.links);
            this.#logger.log(
              `Link created between addresses: ${addressIRI.value} (${sourceGraph}) <--> ${place.address.iri} (${targetGraphIRI})`
            );
          } else if (entity.address.street && place.address.street) {
            const addressStreetSimilarityScore = stringSimilarity(entity.address.street, place.address.street);
            if (addressStreetSimilarityScore >= MIN_SIMILARITY_SCORE) {
              await this.sparqlService.insertLinks(addressIRI, place.address.iri, ALL_GRAPHS_MAP.links);
              this.#logger.log(
                `Link created between addresses: ${addressIRI.value} (${sourceGraph}) <--> ${place.address.iri} (${targetGraphIRI})`
              );
            }
          }
        }
      }
    }
  }

  async #findBestEventCandidate(event: MusicEventEntity, targetGraphIRI: string) {
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
    return bestResult.score >= MIN_SIMILARITY_SCORE ? bestResult.candidate : undefined;
  }
}
