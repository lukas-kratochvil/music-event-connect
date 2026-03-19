import { Link } from "react-router";
import { getConfig } from "@/config/config";
import { useAuth } from "@/hooks/auth/auth";
import { RoutingPath } from "@/utils/routing-paths";
import { SpotifyLoginButton } from "./SpotifyLoginButton";
import { UserProfile } from "./UserProfile";

const Header = () => {
  const { user } = useAuth();
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to={RoutingPath.EVENTS}>
          <h1 className="text-xl font-bold tracking-tight">Music Event Connect</h1>
        </Link>
        <a
          href={getConfig().musicEventConnect.sparqlEndpoint}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1 rounded-full border bg-amber-300 hover:bg-amber-300 transition-all shadow-sm hover:shadow-md"
        >
          SPARQL endpoint
        </a>
        {user ? (
          <UserProfile user={{ username: user.username, photoUrl: user.profileImageUrl }} />
        ) : (
          <SpotifyLoginButton />
        )}
      </div>
    </header>
  );
};

export default Header;
