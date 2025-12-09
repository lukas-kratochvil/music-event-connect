import { readFileSync } from "fs";
import { ObjectSchema } from "joi";
import { load as loadYaml } from "js-yaml";

export const ALLOWED_NODE_ENVS = ["development", "production"] as const;

export type NodeEnv = (typeof ALLOWED_NODE_ENVS)[number];

export const loadYamlConfig = <
  TConfigSchema extends Record<keyof TEnvVars, unknown>,
  TEnvVars extends Record<string, unknown>,
>(
  configYamlFile: string,
  configSchema: ObjectSchema<TConfigSchema>,
  envVars: TEnvVars
): TConfigSchema => {
  const configYaml = loadYaml(readFileSync(configYamlFile, "utf8")) as Record<string, unknown>;
  const config = {
    ...configYaml,
    ...envVars,
  };
  const { error, value } = configSchema.validate(config, {
    allowUnknown: false,
    abortEarly: false,
    debug: envVars["nodeEnv"] === "development",
  });

  if (error) {
    throw Error(`Config validation error: ${error.message}`);
  }

  return value as TConfigSchema;
};
