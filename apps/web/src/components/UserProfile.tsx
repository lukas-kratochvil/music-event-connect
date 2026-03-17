import { LogOut } from "lucide-react";
import { useAuth } from "@/hooks/auth/auth";
import { AvatarImage, AvatarFallback, Avatar } from "./ui/avatar";
import {
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
  DropdownMenu,
} from "./ui/dropdown-menu";

type UserProfileProps = {
  user: {
    username: string;
    photoUrl: string;
  };
};

export const UserProfile = ({ user }: UserProfileProps) => {
  const { logOut } = useAuth();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="h-10 w-10 rounded-full focus-visible:ring-2 focus-visible:ring-primary">
          <Avatar
            size="lg"
            className="cursor-pointer"
          >
            <AvatarImage src={user.photoUrl} />
            <AvatarFallback>{user.username}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="w-56"
        align="end"
      >
        <DropdownMenuLabel>
          <span className="text-sm font-medium">{user.username}</span>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={logOut}
          className="cursor-pointer text-destructive focus:bg-destructive/10"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
