import { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { getConfig } from "@/config/config";

const spotifyConfig = getConfig().oidc.spotify;

export const spotifySDK = SpotifyApi.withUserAuthorization(
  spotifyConfig.clientId,
  spotifyConfig.redirectUri,
  spotifyConfig.scopes
);
