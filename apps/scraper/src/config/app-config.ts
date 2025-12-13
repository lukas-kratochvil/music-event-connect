import { loadYamlConfig } from "@music-event-connect/core";
import { configSchema } from "./schema";

export const appConfig = loadYamlConfig("config.yaml", configSchema, {
  nodeEnv: process.env["NODE_ENV"],
  port: process.env["PORT"],
});
