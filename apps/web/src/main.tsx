import { lazy } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { loadConfig } from "./config/config";

const App = lazy(() => import("./App"));

const renderApp = async () => {
  try {
    await loadConfig();
  } catch (e) {
    console.error("Config not loaded:", e);
    throw e;
  }

  const root = createRoot(document.getElementById("root")!);
  root.render(<App />);
};

void renderApp();
