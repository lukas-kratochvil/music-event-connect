import { createContext, useContext } from "react";

type User = {
  username: string;
  accessToken: string;
  profileImageUrl: string | undefined;
};

type LogInCallback = {
  returnPath: string | undefined;
};

export type Auth = {
  user: User | null;
  logIn: () => Promise<void>;
  logInCallback: () => Promise<LogInCallback>;
  logOut: () => void;
};

// default value is used only when a component does not have a matching Provider above it in the tree – helpful for testing components in isolation
export const AuthContext = createContext<Auth | null>(null);

export const useAuth = () => {
  const auth = useContext(AuthContext);
  if (!auth) {
    throw new Error("useAuth hook must be used within a Provider");
  }
  return auth;
};
