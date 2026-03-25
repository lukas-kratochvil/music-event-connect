import { Inject, Injectable, Logger } from "@nestjs/common";
import type { NamedNode } from "n3";
import { stringSimilarity } from "string-similarity-js";
import { AbstractEntity, ArtistEntity, MusicEventEntity, VenueEntity } from "../../entities";
import { RdfEntitySerializerService } from "../../serialization/rdf-entity-serializer.service";
import { SPARQLService } from "../../sparql/sparql.service";
import { GRAPHS_MAP, LINKED_GRAPHS, MUSIC_EVENT_GRAPHS, type MusicEventGraph } from "../../utils";

type LinkIRI = [NamedNode, string];

const MIN_SIMILARITY_SCORE = 0.9;

@Injectable()
export class LinksMapper {
  @Inject(SPARQLService)
  private readonly sparqlService: SPARQLService;

  readonly #logger = new Logger(LinksMapper.name);

  async #getEntityMissingLinkGraphs(iri: NamedNode, sourceGraph: MusicEventGraph) {
    const linkedResources = await this.sparqlService.getLinkedResources(iri, GRAPHS_MAP.links);
    const connectedGraphIRIs = linkedResources.map((link) => link.graph);
    return LINKED_GRAPHS.filter((graphIRI) => !connectedGraphIRIs.includes(graphIRI) && graphIRI !== sourceGraph);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly #handlers = new Map<string, (entity: any, sourceGraph: MusicEventGraph) => Promise<void>>([
    [MusicEventEntity.name, (event, graph) => this.#handleMusicEvent(event, graph)],
    [ArtistEntity.name, (artist, graph) => this.#handleArtist(artist, graph)],
    [VenueEntity.name, (venue, graph) => this.#handleVenue(venue, graph)],
  ]);

  readonly #eventQueryMap = new Map([
    ...MUSIC_EVENT_GRAPHS.map(
      (eventGraph) =>
        [eventGraph, (startDate: Date) => this.sparqlService.getEventsByDate(startDate, eventGraph)] as const
    ),
    [
      GRAPHS_MAP.musicBrainz,
      (startDate: Date) => this.sparqlService.getMusicBrainzEventsByDate(startDate, GRAPHS_MAP.musicBrainz),
    ] as const,
  ]);

  async #handleMusicEvent(event: MusicEventEntity, sourceGraph: MusicEventGraph) {
    const eventIRI = RdfEntitySerializerService.createEntityIRI(event);
    const eventName = event.name.toLowerCase().trim();
    const missingGraphs = await this.#getEntityMissingLinkGraphs(eventIRI, sourceGraph);
    const candidateLinkIRIs = await Promise.all(
      missingGraphs.map(async (targetGraphIRI) => {
        const getEventCandidates = this.#eventQueryMap.get(targetGraphIRI);
        if (!getEventCandidates) {
          return null;
        }
        const candidates = await getEventCandidates(event.startDate);
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
          this.#logger.log(
            `[MusicEvent]: link queued: ${eventIRI.value} (${sourceGraph}) <--> ${bestCandidate.candidate.iri} (${targetGraphIRI})`
          );
          return [eventIRI, bestCandidate.candidate.iri] satisfies LinkIRI;
        }

        return null;
      })
    );

    const linkIRIs = candidateLinkIRIs.filter((link) => link !== null);

    if (linkIRIs.length > 0) {
      await this.sparqlService.insertLinks(linkIRIs, GRAPHS_MAP.links);
    }

    await Promise.all([
      ...event.artists.map((artist) => this.createEntityLinks(artist, sourceGraph)),
      ...event.venues.map((venue) => this.createEntityLinks(venue, sourceGraph)),
    ]);
  }

  readonly #artistQueryMap = new Map([
    ...MUSIC_EVENT_GRAPHS.map(
      (eventGraph) =>
        [eventGraph, (artistName: string) => this.sparqlService.getArtistsByName(artistName, eventGraph)] as const
    ),
    [
      GRAPHS_MAP.musicBrainz,
      (artistName: string) => this.sparqlService.getMusicBrainzArtistsByName(artistName, GRAPHS_MAP.musicBrainz),
    ] as const,
  ]);

  async #handleArtist(artist: ArtistEntity, sourceGraph: MusicEventGraph) {
    const artistIRI = RdfEntitySerializerService.createEntityIRI(artist);
    const missingGraphs = await this.#getEntityMissingLinkGraphs(artistIRI, sourceGraph);
    const candidatesLinkIRIs = await Promise.all(
      missingGraphs.map(async (targetGraphIRI) => {
        const getArtistCandidates = this.#artistQueryMap.get(targetGraphIRI);
        if (!getArtistCandidates) {
          return null;
        }
        const candidates = await getArtistCandidates(artist.name);
        const iris: LinkIRI[] = candidates.map(({ iri }) => [artistIRI, iri]);
        iris.forEach(([source, target]) =>
          this.#logger.log(`[Artist]: link queued: ${source.value} (${sourceGraph}) <--> ${target} (${targetGraphIRI})`)
        );
        return iris;
      })
    );

    const linkIRIs = candidatesLinkIRIs.filter((link) => link !== null).flat();

    if (linkIRIs.length > 0) {
      await this.sparqlService.insertLinks(linkIRIs, GRAPHS_MAP.links);
    }
  }

  readonly #venueQueryMap = new Map([
    ...MUSIC_EVENT_GRAPHS.map(
      (eventGraph) =>
        [
          eventGraph,
          (latitude: number, longitude: number) =>
            this.sparqlService.getPlacesByCoords(latitude, longitude, eventGraph),
        ] as const
    ),
    [
      GRAPHS_MAP.musicBrainz,
      (latitude: number, longitude: number) =>
        this.sparqlService.getMusicBrainzPlacesByCoords(latitude, longitude, GRAPHS_MAP.musicBrainz),
    ] as const,
  ]);

  async #handleVenue(venue: VenueEntity, sourceGraph: MusicEventGraph) {
    const venueIRI = RdfEntitySerializerService.createEntityIRI(venue);
    const addressIRI = RdfEntitySerializerService.createEntityIRI(venue.address);
    const missingGraphs = await this.#getEntityMissingLinkGraphs(venueIRI, sourceGraph);
    const candidatesLinkIRIs = await Promise.all(
      missingGraphs.map(async (targetGraphIRI) => {
        const getVenueCandidates = this.#venueQueryMap.get(targetGraphIRI);
        if (!getVenueCandidates) {
          return null;
        }
        const iris: LinkIRI[] = [];
        const candidates = await getVenueCandidates(venue.latitude, venue.longitude);

        for (const { place } of candidates) {
          if (MIN_SIMILARITY_SCORE <= stringSimilarity(venue.name, place.name)) {
            iris.push([venueIRI, place.iri]);
            if (place.address) {
              iris.push([addressIRI, place.address.iri]);
            }
          } else if (venue.address.street && place.address?.street) {
            if (MIN_SIMILARITY_SCORE <= stringSimilarity(venue.address.street, place.address.street)) {
              iris.push([addressIRI, place.address.iri]);
            }
          }
        }

        iris.forEach(([source, target]) =>
          this.#logger.log(`[Venue]: link queued: ${source.value} (${sourceGraph}) <--> ${target} (${targetGraphIRI})`)
        );
        return iris;
      })
    );

    const linkIRIs = candidatesLinkIRIs.filter((link) => link !== null).flat();

    if (linkIRIs.length > 0) {
      await this.sparqlService.insertLinks(linkIRIs, GRAPHS_MAP.links);
    }
  }

  async createEntityLinks<TEntity extends AbstractEntity>(entity: TEntity, sourceGraph: MusicEventGraph) {
    const handler = this.#handlers.get(entity.constructor.name);
    if (handler) {
      await handler(entity, sourceGraph);
    }
  }
}
