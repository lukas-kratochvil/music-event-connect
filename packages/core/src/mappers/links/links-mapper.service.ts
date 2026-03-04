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

  private get getMusicEventQueryMap() {
    return new Map<(typeof LINKED_GRAPHS)[number], typeof this.sparqlService.getEventsByDate>([
      ...MUSIC_EVENT_GRAPHS.map(
        (eventGraph) =>
          [
            eventGraph,
            (startDate: Date, eventGraphIRI: string) => this.sparqlService.getEventsByDate(startDate, eventGraphIRI),
          ] as const
      ),
      [
        ALL_GRAPHS_MAP.musicBrainz,
        (startDate: Date, eventGraphIRI: string) =>
          this.sparqlService.getMusicBrainzEventsByDate(startDate, eventGraphIRI),
      ] as const,
    ]);
  }

  async #handleMusicEvent(event: MusicEventEntity, sourceGraph: MusicEventGraph) {
    const eventIRI = RdfEntitySerializerService.createEntityIRI(event);
    const eventName = event.name.toLowerCase().trim();
    const missingGraphs = await this.#getEntityMissingLinkGraphs(eventIRI, sourceGraph);

    const graphTasks = missingGraphs.map(async (targetGraphIRI) => {
      const getEventCandidates = this.getMusicEventQueryMap.get(targetGraphIRI);
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

  private get getArtistQueryMap() {
    return new Map<(typeof LINKED_GRAPHS)[number], typeof this.sparqlService.getArtistsByName>([
      ...MUSIC_EVENT_GRAPHS.map(
        (eventGraph) =>
          [
            eventGraph,
            (artistName: string, eventGraphIRI: string) =>
              this.sparqlService.getArtistsByName(artistName, eventGraphIRI),
          ] as const
      ),
      [
        ALL_GRAPHS_MAP.musicBrainz,
        (artistName: string, eventGraphIRI: string) =>
          this.sparqlService.getMusicBrainzArtistsByName(artistName, eventGraphIRI),
      ] as const,
    ]);
  }

  async #handleArtist(artist: ArtistEntity, sourceGraph: MusicEventGraph) {
    const artistIRI = RdfEntitySerializerService.createEntityIRI(artist);
    const missingGraphs = await this.#getEntityMissingLinkGraphs(artistIRI, sourceGraph);

    const graphTasks = missingGraphs.map(async (targetGraphIRI) => {
      const getArtistCandidates = this.getArtistQueryMap.get(targetGraphIRI);
      if (!getArtistCandidates) {
        return;
      }
      const candidates = await getArtistCandidates(artist.name, targetGraphIRI);
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

  private get getVenueQueryMap() {
    return new Map<(typeof LINKED_GRAPHS)[number], typeof this.sparqlService.getPlacesByCoords>([
      ...MUSIC_EVENT_GRAPHS.map(
        (eventGraph) =>
          [
            eventGraph,
            (latitude: number, longitude: number, eventGraphIRI: string) =>
              this.sparqlService.getPlacesByCoords(latitude, longitude, eventGraphIRI),
          ] as const
      ),
      [
        ALL_GRAPHS_MAP.musicBrainz,
        (latitude: number, longitude: number, eventGraphIRI: string) =>
          this.sparqlService.getMusicBrainzPlacesByCoords(latitude, longitude, eventGraphIRI),
      ] as const,
    ]);
  }

  async #handleVenue(venue: VenueEntity, sourceGraph: MusicEventGraph) {
    const venueIRI = RdfEntitySerializerService.createEntityIRI(venue);
    const addressIRI = RdfEntitySerializerService.createEntityIRI(venue.address);
    const missingGraphs = await this.#getEntityMissingLinkGraphs(venueIRI, sourceGraph);

    const graphTasks = missingGraphs.map(async (targetGraphIRI) => {
      const getVenuesCandidates = this.getVenueQueryMap.get(targetGraphIRI);
      if (!getVenuesCandidates) {
        return;
      }
      const candidates = await getVenuesCandidates(venue.latitude, venue.longitude, targetGraphIRI);

      for (const { place } of candidates) {
        if (MIN_SIMILARITY_SCORE <= stringSimilarity(venue.name, place.name)) {
          await this.sparqlService.insertLinks(venueIRI, place.iri, ALL_GRAPHS_MAP.links);
          this.#logger.log(
            `Link created between venues: ${venueIRI.value} (${sourceGraph}) <--> ${place.iri} (${targetGraphIRI})`
          );

          if (place.address) {
            await this.sparqlService.insertLinks(addressIRI, place.address.iri, ALL_GRAPHS_MAP.links);
            this.#logger.log(
              `Link created between addresses: ${addressIRI.value} (${sourceGraph}) <--> ${place.address.iri} (${targetGraphIRI})`
            );
          }
        } else if (venue.address.street && place.address?.street) {
          if (MIN_SIMILARITY_SCORE <= stringSimilarity(venue.address.street, place.address.street)) {
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

  async createEntityLinks<TEntity extends AbstractEntity>(entity: TEntity, sourceGraph: MusicEventGraph) {
    const handler = this.#handlers.get(entity.constructor.name);
    if (handler) {
      await handler(entity, sourceGraph);
    }
  }
}
