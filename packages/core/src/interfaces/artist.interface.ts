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
   * Artist's country of origin.
   */
  // TODO: include artist's country?
  // country: string | undefined;

  /**
   * Images of the artist.
   */
  // TODO: also add images?
  // images: string[];
}
