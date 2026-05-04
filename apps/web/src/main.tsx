import { lazy } from "react";
import { createRoot } from "react-dom/client";
import { loadConfig } from "./config/config";
import "./index.css";

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
