import { baseConfigSchema } from "@music-event-connect/core";
import { z } from "zod";

export const configSchema = z
  .object({
    ...baseConfigSchema.shape,
    cors: z.object({
      allowedOrigins: z.array(z.httpUrl()),
    }),
    throttler: z.object({
      ttl: z.int().nonnegative(),
      limit: z.int().nonnegative(),
    }),
    tripleStore: z.object({
      endpointUrl: z.string().trim().nonempty(), // strict validation in the superRefine()
      user: z.string().trim().nonempty(),
      password: z.string().trim().nonempty(),
    }),
  })
  .superRefine((data, ctx) => {
    const tripleStoreEndpointURL = data.tripleStore.endpointUrl;

    if (data.nodeEnv === "development") {
      // allow Docker service name in URL in development
      try {
        new URL(tripleStoreEndpointURL);
      } catch {
        ctx.addIssue({
          code: "custom",
          message: "Invalid development URL",
          path: ["tripleStore", "endpointUrl"],
        });
      }
    } else {
      if (!z.httpUrl().safeParse(tripleStoreEndpointURL).success) {
        ctx.addIssue({
          code: "custom",
          message: "Must be a valid, fully qualified public URL",
          path: ["tripleStore", "endpointUrl"],
        });
      }
    }
  });

export type ConfigSchema = z.infer<typeof configSchema>;
