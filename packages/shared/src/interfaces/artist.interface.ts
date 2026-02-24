import type { IOnlineAccount } from "./online-account.interface";

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
   * Links to other artist's accounts like Facebook, Spotify or MusicBrainz.
   */
  accounts: IOnlineAccount[];

  /**
   * Names of music genres of artist's work.
   */
  genres: string[];

  /**
   * Images of the artist.
   */
  images: string[];
}
