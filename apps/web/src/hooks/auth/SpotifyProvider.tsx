import { useEffect, useState, type PropsWithChildren } from "react";
import { spotifySDK } from "@/services/spotify-sdk";
import { SessionStorageKeys } from "@/utils/storage-keys";
import { AuthContext, type Auth } from "./auth";

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

  const logIn = async () => {
    await spotifySDK.authenticate();
  };

  const logInCallback = async () => {
    const res = await spotifySDK.authenticate();

    if (!res.authenticated) {
      throw new Error("Login to Spotify failed!");
    }

    const profile = await spotifySDK.currentUser.profile();
    setUser({
      username: profile.display_name,
      accessToken: res.accessToken.access_token,
      profileImageUrl: profile.images.at(0)?.url,
    });
    return true;
  };

  const logOut = () => {
    spotifySDK.logOut();
    setUser(null);
  };

  return { logIn, logInCallback, logOut, user };
};

const SpotifyProvider = ({ children }: PropsWithChildren) => (
  <AuthContext value={useSpotifyProvider()}>{children}</AuthContext>
);

export default SpotifyProvider;
