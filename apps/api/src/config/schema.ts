import { ALLOWED_NODE_ENVS, type NodeEnv } from "@music-event-connect/core";
import Joi from "joi";

export type ConfigSchema = {
  nodeEnv: NodeEnv;
  port: number;
  webUrl: string;
  throttler: {
    ttl: number;
    limit: number;
  };
};

export const configSchema = Joi.object<ConfigSchema, true>({
  nodeEnv: Joi.string()
    .trim()
    .valid(...ALLOWED_NODE_ENVS)
    .required(),
  port: Joi.number().port().required(),
  webUrl: Joi.string()
    .uri({ scheme: ["http", "https"] })
    .required(),
  throttler: Joi.object<ConfigSchema["throttler"], true>({
    ttl: Joi.number().integer().min(0).required(),
    limit: Joi.number().integer().min(0).required(),
  }).required(),
});
