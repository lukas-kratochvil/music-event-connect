import { baseConfigSchema, portValidator } from "@music-event-connect/core/config";
import { z } from "zod";

export const configSchema = z.object({
  ...baseConfigSchema.shape,
  redis: z.object({
    host: z.string().trim().nonempty(),
    port: portValidator,
  }),
  services: z.object({
    goout: z
      .object({
        url: z.httpUrl(),
      })
      .optional(),
    ticketmaster: z
      .object({
        url: z.httpUrl(),
        apiKey: z.string().trim().nonempty(),
      })
      .optional(),
    ticketportal: z
      .object({
        url: z.httpUrl(),
      })
      .optional(),
  }),
});

export type ConfigSchema = z.infer<typeof configSchema>;
