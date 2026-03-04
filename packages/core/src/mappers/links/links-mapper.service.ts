import { Inject, Injectable, Logger } from "@nestjs/common";
import type { NamedNode } from "n3";
import { stringSimilarity } from "string-similarity-js";
import { AbstractEntity, ArtistEntity, MusicEventEntity, VenueEntity } from "../../entities";
import { RdfEntitySerializerService } from "../../serialization/rdf-entity-serializer.service";
import { SPARQLService } from "../../sparql/sparql.service";
import { ALL_GRAPHS_MAP, LINKED_GRAPHS, MUSIC_EVENT_GRAPHS, type MusicEventGraph } from "../../utils";

const MIN_SIMILARITY_SCORE = 0.9;

@Injectable()
export class LinksMapper {
  @Inject(SPARQLService)
  private readonly sparqlService: SPARQLService;

  readonly #logger = new Logger(LinksMapper.name);

  async #getEntityMissingLinkGraphs(iri: NamedNode, sourceGraph: MusicEventGraph) {
    const linkedResources = await this.sparqlService.getLinkedResources(iri, ALL_GRAPHS_MAP.links);
    const connectedGraphIRIs = linkedResources.map((link) => link.graph);
    return LINKED_GRAPHS.filter((graphIRI) => !connectedGraphIRIs.includes(graphIRI) && graphIRI !== sourceGraph);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly #handlers = new Map<string, (entity: any, sourceGraph: MusicEventGraph) => Promise<void>>([
    [MusicEventEntity.name, (event, graph) => this.#handleMusicEvent(event, graph)],
    [ArtistEntity.name, (artist, graph) => this.#handleArtist(artist, graph)],
    [VenueEntity.name, (venue, graph) => this.#handleVenue(venue, graph)],
  ]);

  async #handleMusicEvent(event: MusicEventEntity, sourceGraph: MusicEventGraph) {
    const eventIRI = RdfEntitySerializerService.createEntityIRI(event);
    const eventName = event.name.toLowerCase().trim();
    const GET_EVENTS_FN_MAP = new Map<(typeof LINKED_GRAPHS)[number], typeof this.sparqlService.getEventsByDate>([
      ...MUSIC_EVENT_GRAPHS.map((eventGraph) => [eventGraph, this.sparqlService.getEventsByDate] as const),
      [ALL_GRAPHS_MAP.musicBrainz, this.sparqlService.getMusicBrainzEventsByDate],
    ]);
    const missingGraphs = await this.#getEntityMissingLinkGraphs(eventIRI, sourceGraph);
    const graphTasks = missingGraphs.map(async (targetGraphIRI) => {
      const getEventCandidates = GET_EVENTS_FN_MAP.get(targetGraphIRI);
      if (!getEventCandidates) {
        return;
      }
      const candidates = await getEventCandidates(event.startDate, targetGraphIRI);
      const bestCandidate = candidates
        .map((candidate) => {
          const candidateName = candidate.name.toLowerCase().trim();
          return {
            score: stringSimilarity(eventName, candidateName),
            candidate,
          };
        })
        .toSorted((a, b) => a.score - b.score)
        .pop();

      if (bestCandidate && bestCandidate.score >= MIN_SIMILARITY_SCORE) {
        await this.sparqlService.insertLinks(eventIRI, bestCandidate.candidate.iri, ALL_GRAPHS_MAP.links);
        this.#logger.log(
          `Link created between events: ${eventIRI.value} (${sourceGraph}) <--> ${bestCandidate.candidate.iri} (${targetGraphIRI})`
        );
      }
    });

    await Promise.all([
      ...graphTasks,
      ...event.artists.map((artist) => this.createEntityLinks(artist, sourceGraph)),
      ...event.venues.map((venue) => this.createEntityLinks(venue, sourceGraph)),
    ]);
  }

  async #handleArtist(artist: ArtistEntity, sourceGraph: MusicEventGraph) {
    const artistIRI = RdfEntitySerializerService.createEntityIRI(artist);
    const missingGraphs = await this.#getEntityMissingLinkGraphs(artistIRI, sourceGraph);

    // TODO: link artist with MusicBrainz artist by the `rdfs:label` or `skos:altLabel`
    // TODO: link genres with MusicBrainz genres by the `rdfs:label`

    const graphTasks = missingGraphs.map(async (targetGraphIRI) => {
      const candidates = await this.sparqlService.getArtistsByName(artist.name, targetGraphIRI);
      const candidateTasks = candidates.map(async (candidate) => {
        await this.sparqlService.insertLinks(artistIRI, candidate.iri, ALL_GRAPHS_MAP.links);
        this.#logger.log(
          `Link created between artists: ${artistIRI.value} (${sourceGraph}) <--> ${candidate.iri} (${targetGraphIRI})`
        );
      });
      await Promise.all(candidateTasks);
    });

    await Promise.all(graphTasks);
  }

  async #handleVenue(venue: VenueEntity, sourceGraph: MusicEventGraph) {
    const venueIRI = RdfEntitySerializerService.createEntityIRI(venue);
    const addressIRI = RdfEntitySerializerService.createEntityIRI(venue.address);
    const missingGraphs = await this.#getEntityMissingLinkGraphs(venueIRI, sourceGraph);

    // TODO: link places with MusicBrainz places by the `rdfs:label` or `wdt:P625` coordinates or `wdt:P6375` address

    const graphTasks = missingGraphs.map(async (targetGraphIRI) => {
      const candidates = await this.sparqlService.getPlacesByCoords(venue.latitude, venue.longitude, targetGraphIRI);

      for (const { place } of candidates) {
        const venueNameSimilarityScore = stringSimilarity(venue.name, place.name);
        if (venueNameSimilarityScore >= MIN_SIMILARITY_SCORE) {
          await this.sparqlService.insertLinks(venueIRI, place.iri, ALL_GRAPHS_MAP.links);
          this.#logger.log(
            `Link created between venues: ${venueIRI.value} (${sourceGraph}) <--> ${place.iri} (${targetGraphIRI})`
          );
          await this.sparqlService.insertLinks(addressIRI, place.address.iri, ALL_GRAPHS_MAP.links);
          this.#logger.log(
            `Link created between addresses: ${addressIRI.value} (${sourceGraph}) <--> ${place.address.iri} (${targetGraphIRI})`
          );
        } else if (venue.address.street && place.address.street) {
          const addressStreetSimilarityScore = stringSimilarity(venue.address.street, place.address.street);
          if (addressStreetSimilarityScore >= MIN_SIMILARITY_SCORE) {
            await this.sparqlService.insertLinks(addressIRI, place.address.iri, ALL_GRAPHS_MAP.links);
            this.#logger.log(
              `Link created between addresses: ${addressIRI.value} (${sourceGraph}) <--> ${place.address.iri} (${targetGraphIRI})`
            );
          }
        }
      }
    });

    await Promise.all(graphTasks);
  }

  // TODO: match MusicBrainz entities
  async createEntityLinks<TEntity extends AbstractEntity>(entity: TEntity, sourceGraph: MusicEventGraph) {
    const handler = this.#handlers.get(entity.constructor.name);
    if (handler) {
      await handler(entity, sourceGraph);
    }
  }
}
