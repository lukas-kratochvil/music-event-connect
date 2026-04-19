import { MusicBrainzMapper } from "@music-event-connect/core/mappers";
import { Injectable } from "@nestjs/common";
import type { Genre } from "./entities/genre.entity";

@Injectable()
export class GenresService {
  constructor(private readonly musicBrainzMapper: MusicBrainzMapper) {}

  async findAll(): Promise<Genre[]> {
    const genres = await this.musicBrainzMapper.findGenres();
    return genres.map((genre) => ({ name: genre.name }));
  }
}
