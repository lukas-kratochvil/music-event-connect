import { baseConfigSchema, dockerUrlValidator } from "@music-event-connect/core/config";
import { z } from "zod";

export const configSchema = z.object({
  ...baseConfigSchema.shape,
  cors: z.object({
    allowedOrigins: z.array(z.httpUrl()),
  }),
  throttler: z.object({
    ttl: z.int().nonnegative(),
    limit: z.int().nonnegative(),
  }),
  tripleStore: z.object({
    endpointUrl: dockerUrlValidator,
    user: z.string().trim().nonempty(),
    password: z.string().trim().nonempty(),
  }),
});

export type ConfigSchema = z.infer<typeof configSchema>;
