/**
 * Browser session storage keys.
 */
export const SessionStorageKeys = {
  USER_RETURN_PATH_AFTER_LOGIN: "user_return_path",
  LOGGED_IN_USER: "user",
  SPOTIFY_AUTH_STATE: "spotify_auth_state",
  SPOTIFY_CODE_VERIFIER: "spotify_code_verifier",
  SPOTIFY_SDK_TOKEN: "spotify-sdk:AuthorizationCodeWithPKCEStrategy:token",
} as const;
