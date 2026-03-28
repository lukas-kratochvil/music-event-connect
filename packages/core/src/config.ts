import { readFileSync } from "fs";
import type { ObjectSchema } from "joi";
import { load as loadYaml } from "js-yaml";

export const ALLOWED_NODE_ENVS = ["development", "production"] as const;

export type NodeEnv = (typeof ALLOWED_NODE_ENVS)[number];

export const loadYamlConfig = <TConfigSchema extends Record<"nodeEnv" | "port", unknown>>(
  configYamlFile: string,
  configSchema: ObjectSchema<TConfigSchema>
): TConfigSchema => {
  const configYaml = loadYaml(readFileSync(configYamlFile, "utf8")) as Record<string, unknown>;
  const { error, value } = configSchema.validate(configYaml, {
    allowUnknown: false,
    abortEarly: false,
    debug: configYaml["nodeEnv"] === "development",
  });

  if (error) {
    throw Error(`Config validation error: ${error.message}`);
  }

  return value as TConfigSchema;
};
