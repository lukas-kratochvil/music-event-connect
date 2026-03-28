import { baseConfigSchema, portValidator } from "@music-event-connect/core";
import { z } from "zod";

export const configSchema = z
  .object({
    ...baseConfigSchema.shape,
    redis: z.object({
      host: z.string().trim().nonempty(),
      port: portValidator,
      cache: z.object({
        ttl: z.int().nonnegative(),
      }),
    }),
    tripleStore: z.object({
      endpointUrl: z.string().trim().nonempty(), // strict validation in the superRefine()
      updateUrl: z.string().trim().nonempty(), // strict validation in the superRefine()
      user: z.string().trim().nonempty(),
      password: z.string().trim().nonempty(),
    }),
    locationIQ: z.object({
      url: z.httpUrl(),
      apiKey: z.string().trim().nonempty(),
    }),
  })
  .superRefine((data, ctx) => {
    const tripleStore = {
      endpointUrl: data.tripleStore.endpointUrl,
      updateUrl: data.tripleStore.updateUrl,
    };

    if (data.nodeEnv === "development") {
      // allow Docker service name in URL in development
      try {
        new URL(tripleStore.endpointUrl);
      } catch {
        ctx.addIssue({
          code: "custom",
          message: "Invalid development URL",
          path: ["tripleStore", "endpointUrl"],
        });
      }
      try {
        new URL(tripleStore.updateUrl);
      } catch {
        ctx.addIssue({
          code: "custom",
          message: "Invalid development URL",
          path: ["tripleStore", "updateUrl"],
        });
      }
    } else {
      if (!z.httpUrl().safeParse(tripleStore.endpointUrl).success) {
        ctx.addIssue({
          code: "custom",
          message: "Must be a valid, fully qualified public URL",
          path: ["tripleStore", "endpointUrl"],
        });
      }
      if (!z.httpUrl().safeParse(tripleStore.updateUrl).success) {
        ctx.addIssue({
          code: "custom",
          message: "Must be a valid, fully qualified public URL",
          path: ["tripleStore", "updateUrl"],
        });
      }
    }
  });

export type ConfigSchema = z.infer<typeof configSchema>;
