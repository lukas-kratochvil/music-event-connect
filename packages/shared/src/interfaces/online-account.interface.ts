/**
 * The online account of the artist.
 */
export interface IOnlineAccount {
  /**
   * The unique identifier.
   */
  id: string;

  /**
   * The URL to the online account.
   */
  url: string;

  /**
   * Indicates the name (identifier) associated with this online account.
   */
  accountName: string;

  /**
   * Indicates a homepage of the service provided for this online account.
   */
  accountServiceHomepage: string;
}
