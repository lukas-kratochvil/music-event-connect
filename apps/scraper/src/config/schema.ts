import { baseConfigSchema, portValidator } from "@music-event-connect/core/config";
import { z } from "zod";

/**
 * Validates ISO 8601 time in the format `HH:MM:SS` and transforms the value to object containing each part of the specified time.
 */
const scheduledTimeValidator = z.iso.time({ precision: 0 }).transform((val) => {
  const [hours, minutes, seconds] = (val.split(":") as [string, string, string]).map((part) => +part) as [
    number,
    number,
    number,
  ];
  return {
    hours,
    minutes,
    seconds,
  };
});

export const configSchema = z.object({
  ...baseConfigSchema.shape,
  redis: z.object({
    host: z.string().trim().nonempty(),
    port: portValidator,
  }),
  services: z.object({
    goout: z
      .object({
        scheduledTime: scheduledTimeValidator,
        url: z.httpUrl(),
      })
      .optional(),
    ticketmaster: z
      .object({
        scheduledTime: scheduledTimeValidator,
        url: z.httpUrl(),
        apiKey: z.string().trim().nonempty(),
      })
      .optional(),
    ticketportal: z
      .object({
        scheduledTime: scheduledTimeValidator,
        url: z.httpUrl(),
      })
      .optional(),
  }),
});

export type ConfigSchema = z.infer<typeof configSchema>;
