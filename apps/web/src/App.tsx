import { StrictMode } from "react";
import { BrowserRouter } from "react-router";
import "./App.css";
import AppRouting from "./AppRouting";

const App = () => (
  <StrictMode>
    <BrowserRouter>
      <AppRouting />
    </BrowserRouter>
  </StrictMode>
);

export default App;
