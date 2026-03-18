import { useAuth } from "@/hooks/auth/auth";
import { Button } from "../ui/button";

export const SpotifyLoginButton = () => {
  const { logIn } = useAuth();
  return (
    <Button
      onClick={logIn}
      className="flex items-center gap-3 cursor-pointer px-3 py-5 bg-[#1ED760] hover:bg-[#1cdf59] transition-all shadow-sm hover:shadow-md"
    >
      <img
        src="https://storage.googleapis.com/pr-newsroom-wp/1/2023/05/Spotify_Primary_Logo_RGB_Green.png"
        alt="Spotify logo"
        className="h-6 w-6 object-contain brightness-0 invert"
      />
      Log in with Spotify
    </Button>
  );
};
