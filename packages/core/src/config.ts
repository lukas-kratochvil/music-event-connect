import { readFileSync } from "fs";
import { load as loadYaml } from "js-yaml";
import { z } from "zod";

export const portValidator = z.int().nonnegative().max(65535);

export const baseConfigSchema = z.object({
  nodeEnv: z.enum(["development", "production"]),
  port: portValidator,
});

export const loadYamlConfig = <TConfigSchema extends typeof baseConfigSchema>(
  configYamlFile: string,
  configSchema: TConfigSchema
) => {
  const configYaml = loadYaml(readFileSync(configYamlFile, "utf8")) as Record<string, unknown>;
  const config = configSchema.safeParse(configYaml);

  if (!config.success) {
    throw Error("Config validation error: " + z.prettifyError(config.error));
  }

  return config.data;
};
