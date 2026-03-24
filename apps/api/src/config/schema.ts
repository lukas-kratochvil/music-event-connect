import { ALLOWED_NODE_ENVS, type NodeEnv } from "@music-event-connect/core";
import Joi from "joi";

export type ConfigSchema = {
  nodeEnv: NodeEnv;
  port: number;
  cors: {
    allowedOrigins: string[];
  };
  throttler: {
    ttl: number;
    limit: number;
  };
  tripleStore: {
    endpointUrl: string;
    user: string;
    password: string;
  };
};

export const configSchema = Joi.object<ConfigSchema, true>({
  nodeEnv: Joi.string()
    .trim()
    .valid(...ALLOWED_NODE_ENVS)
    .required(),
  port: Joi.number().port().required(),
  cors: Joi.object<ConfigSchema["cors"], true>({
    allowedOrigins: Joi.array<string[]>()
      .items(
        Joi.string()
          .uri({ scheme: ["http", "https"] })
          .required()
      )
      .required(),
  }),
  throttler: Joi.object<ConfigSchema["throttler"], true>({
    ttl: Joi.number().integer().min(0).required(),
    limit: Joi.number().integer().min(0).required(),
  }).required(),
  tripleStore: Joi.object<ConfigSchema["tripleStore"], true>({
    endpointUrl: Joi.string().trim().uri().required(),
    user: Joi.string().trim().required(),
    password: Joi.string().trim().required(),
  }),
});
