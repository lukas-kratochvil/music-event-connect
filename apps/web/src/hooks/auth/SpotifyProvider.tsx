import type { AccessToken } from "@spotify/web-api-ts-sdk";
import { useEffect, useState, type PropsWithChildren } from "react";
import { getConfig } from "@/config/config";
import { spotifySDK } from "@/services/spotify/spotify-sdk";
import { SessionStorageKeys } from "@/utils/storage-keys";
import { AuthContext, type Auth } from "./auth";
import { base64Encode, generateRandomString, sha256 } from "./utils";

const spotifyConfig = getConfig().oidc.spotify;

const useSpotifyProvider = (): Auth => {
  const [user, setUser] = useState<Auth["user"]>(() => {
    const loggedInUser = window.sessionStorage.getItem(SessionStorageKeys.LOGGED_IN_USER);
    return loggedInUser ? JSON.parse(loggedInUser) : null;
  });

  // Manage user's session storage.
  useEffect(() => {
    if (user) {
      window.sessionStorage.setItem(SessionStorageKeys.LOGGED_IN_USER, JSON.stringify(user));
    } else {
      window.sessionStorage.removeItem(SessionStorageKeys.LOGGED_IN_USER);
    }
  }, [user]);

  // Load user if the Spotify account is in the local storage
  useEffect(() => {
    const loadUser = async () => {
      try {
        const profile = await spotifySDK.currentUser.profile();
        const accessToken = await spotifySDK.getAccessToken();

        if (accessToken) {
          setUser({
            username: profile.display_name,
            accessToken: accessToken.access_token,
            profileImageUrl: profile.images.sort((a, b) => a.height - b.height).at(0)?.url,
          });
        } else {
          spotifySDK.logOut();
        }
      } catch {
        spotifySDK.logOut();
      }
    };

    if (!user && window.localStorage.getItem(SessionStorageKeys.SPOTIFY_SDK_TOKEN)) {
      void loadUser();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // The Spotify login is implemented manually because the official Spotify Web API SDK doesn't allow to change the user.
  const logIn: Auth["logIn"] = async () => {
    window.sessionStorage.setItem(SessionStorageKeys.USER_RETURN_PATH_AFTER_LOGIN, window.location.pathname);

    // protection against CSRF attacks
    const state = generateRandomString(16);
    window.sessionStorage.setItem(SessionStorageKeys.SPOTIFY_AUTH_STATE, state);

    // protection against authorization code interception and injection attacks
    const codeVerifier = generateRandomString(64);
    window.sessionStorage.setItem(SessionStorageKeys.SPOTIFY_CODE_VERIFIER, codeVerifier);
    const hashedCode = await sha256(codeVerifier);
    const codeChallenge = base64Encode(hashedCode);

    const authUrl = new URL("https://accounts.spotify.com/authorize");
    const params = {
      client_id: spotifyConfig.clientId,
      response_type: "code",
      redirect_uri: spotifyConfig.redirectUri,
      state,
      scope: spotifyConfig.scopes.join(" "),
      code_challenge_method: "S256",
      code_challenge: codeChallenge,
      show_dialog: "true", // force to display Spotify login window where is the option to change the user, otherwise the last logged in Spotify user will logged in our app
    };
    authUrl.search = new URLSearchParams(params).toString();
    window.location.href = authUrl.toString();
  };

  const logInCallback: Auth["logInCallback"] = async () => {
    const queryParams = new URLSearchParams(window.location.search);
    const error = queryParams.get("error");
    const code = queryParams.get("code");
    const returnedState = queryParams.get("state");

    const codeVerifier = window.sessionStorage.getItem(SessionStorageKeys.SPOTIFY_CODE_VERIFIER);
    window.sessionStorage.removeItem(SessionStorageKeys.SPOTIFY_CODE_VERIFIER);
    const savedState = window.sessionStorage.getItem(SessionStorageKeys.SPOTIFY_AUTH_STATE);
    window.sessionStorage.removeItem(SessionStorageKeys.SPOTIFY_AUTH_STATE);
    const returnPath = window.sessionStorage.getItem(SessionStorageKeys.USER_RETURN_PATH_AFTER_LOGIN);
    window.sessionStorage.removeItem(SessionStorageKeys.USER_RETURN_PATH_AFTER_LOGIN);

    if (error === "access_denied") {
      // Spotify login cancelled
      return { returnPath: returnPath ?? undefined };
    }
    if (!returnedState || returnedState !== savedState) {
      throw new Error("Security alert: Possible CSRF attack!");
    }
    if (!code || !codeVerifier) {
      throw new Error("Authorization code not present!");
    }

    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: spotifyConfig.clientId,
        grant_type: "authorization_code",
        code,
        redirect_uri: spotifyConfig.redirectUri,
        code_verifier: codeVerifier,
      }),
    });

    if (!response.ok) {
      throw new Error("Spotify login failed!");
    }

    const data = (await response.json()) as AccessToken;
    // HACK: store obtained token data for the Spotify SDK using its own local storage key, so that we can use Spotify SDK and following requests don't require user to log in again
    window.localStorage.setItem(SessionStorageKeys.SPOTIFY_SDK_TOKEN, JSON.stringify(data));

    const profile = await spotifySDK.currentUser.profile();
    setUser({
      username: profile.display_name,
      accessToken: data.access_token,
      profileImageUrl: profile.images.sort((a, b) => a.height - b.height).at(0)?.url,
    });
    return { returnPath: returnPath ?? undefined };
  };

  const logOut: Auth["logOut"] = () => {
    spotifySDK.logOut();
    setUser(null);
  };

  return { logIn, logInCallback, logOut, user };
};

const SpotifyProvider = ({ children }: PropsWithChildren) => (
  <AuthContext value={useSpotifyProvider()}>{children}</AuthContext>
);

export default SpotifyProvider;
