import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import AppRouting from "./AppRouting";

const queryClient = new QueryClient();

const App = () => (
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AppRouting />
    </QueryClientProvider>
  </StrictMode>
);

export default App;
