import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { compression } from "vite-plugin-compression2";

const port = process.env["PORT"] ? +process.env["PORT"] : undefined;

const reactCompilerConfig = {};

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [["babel-plugin-react-compiler", reactCompilerConfig]],
      },
    }),
    tailwindcss(),
    // Vite build also creates compressed files
    compression({
      algorithms: ["gzip"],
    }),
  ],
  resolve: {
    alias: {
      // shadcn CLI relies on the root "@" path being present in the `resolve.alias`
      // usage of the `vite-tsconfig-paths` package instead of this alias will cause an error
      "@": path.resolve(__dirname, "./src"),
    },
  },
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
