import { baseConfigSchema } from "@music-event-connect/core";
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
    endpointUrl: z.httpUrl(),
    user: z.string().trim().nonempty(),
    password: z.string().trim().nonempty(),
  }),
});

export type ConfigSchema = z.infer<typeof configSchema>;
