import { loadYamlConfig } from "@music-event-connect/core";
import { configSchema } from "./schema";

export const appConfig = loadYamlConfig("config.yaml", configSchema);
