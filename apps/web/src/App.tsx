import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { lazy, StrictMode } from "react";

const SpotifyProvider = lazy(() => import("./hooks/auth/SpotifyProvider"));
const AppRouting = lazy(() => import("./AppRouting"));

const queryClient = new QueryClient();

const App = () => (
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <SpotifyProvider>
        <AppRouting />
      </SpotifyProvider>
    </QueryClientProvider>
  </StrictMode>
);

export default App;
