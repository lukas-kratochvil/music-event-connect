import { StrictMode } from "react";
import { BrowserRouter } from "react-router";
import AppRouting from "./AppRouting";

const App = () => (
  <StrictMode>
    <BrowserRouter>
      <AppRouting />
    </BrowserRouter>
  </StrictMode>
);

export default App;
