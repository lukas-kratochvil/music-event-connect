/**
 * Artist performing in music event.
 */
export interface IArtist {
  /**
   * The unique identifier.
   */
  id: string;

  /**
   * The name.
   */
  name: string;

  /**
   * Links to other artist's profiles like Spotify or MusicBrainz.
   */
  sameAs: string[];

  /**
   * Names of music genres of artist's work.
   */
  genres: string[];

  /**
   * Images of the artist.
   */
  images: string[];
}
