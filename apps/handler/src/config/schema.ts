import { baseConfigSchema, portValidator } from "@music-event-connect/core";
import { z } from "zod";

export const configSchema = z.object({
  ...baseConfigSchema.shape,
  redis: z.object({
    host: z.string().trim().nonempty(),
    port: portValidator,
    cache: z.object({
      ttl: z.int().nonnegative(),
    }),
  }),
  tripleStore: z.object({
    endpointUrl: z.httpUrl(),
    updateUrl: z.httpUrl(),
    user: z.string().trim().nonempty(),
    password: z.string().trim().nonempty(),
  }),
  locationIQ: z.object({
    url: z.httpUrl(),
    apiKey: z.string().trim().nonempty(),
  }),
});

export type ConfigSchema = z.infer<typeof configSchema>;
