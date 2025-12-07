import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const port = process.env?.["PORT"] ? +process.env?.["PORT"] : undefined;

const reactCompilerConfig = {};

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [["babel-plugin-react-compiler", reactCompilerConfig]],
      },
    }),
  ],
  // 'server' setup is only for a local development
  server: {
    host: true, // it's a must for Docker container port mapping to work
    strictPort: true,
    port,
    // `hmr.clientPort` and `watch.usePolling` are important for HMR to work in the Docker container
    hmr: {
      clientPort: port,
    },
    watch: {
      usePolling: true,
    },
  },
});
