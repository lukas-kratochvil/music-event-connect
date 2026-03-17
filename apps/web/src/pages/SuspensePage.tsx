import { Loader2 } from "lucide-react";

const SuspensePage = () => (
  <div className="flex min-h-screen items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-4 text-muted-foreground">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="text-sm font-medium">Loading...</p>
    </div>
  </div>
);

export default SuspensePage;
