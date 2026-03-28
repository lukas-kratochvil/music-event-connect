import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parse } from "yaml";
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
  const configPath = resolve(process.cwd(), configYamlFile);
  let parsedYaml;

  try {
    const fileContent = readFileSync(configPath, "utf8");
    parsedYaml = parse(fileContent);
  } catch (error) {
    throw new Error("Failed to load YAML config: " + (error instanceof Error ? error.message : error));
  }

  const config = configSchema.safeParse(parsedYaml);

  if (!config.success) {
    throw Error("Config validation error: " + z.prettifyError(config.error));
  }

  return config.data;
};
