import { ALLOWED_NODE_ENVS, type NodeEnv } from "@music-event-connect/core";
import Joi from "joi";

export type ConfigSchema = {
  nodeEnv: NodeEnv;
  port: number;
  redis: {
    host: string;
    port: number;
    cache: {
      ttl: number;
    };
  };
  tripleStore: {
    endpointUrl: string;
    updateUrl: string;
    user: string;
    password: string;
  };
  locationIQ: {
    url: string;
    apiKey: string;
  };
};

export const configSchema = Joi.object<ConfigSchema, true>({
  nodeEnv: Joi.string()
    .trim()
    .valid(...ALLOWED_NODE_ENVS)
    .required(),
  port: Joi.number().port().required(),
  redis: Joi.object<ConfigSchema["redis"], true>({
    host: Joi.string().trim().required(),
    port: Joi.number().port().required(),
    cache: Joi.object<ConfigSchema["redis"]["cache"], true>({
      ttl: Joi.number().integer().min(0).required(),
    }),
  }),
  tripleStore: Joi.object<ConfigSchema["tripleStore"], true>({
    endpointUrl: Joi.string().trim().uri().required(),
    updateUrl: Joi.string().trim().uri().required(),
    user: Joi.string().trim().required(),
    password: Joi.string().trim().required(),
  }),
  locationIQ: Joi.object<ConfigSchema["locationIQ"], true>({
    url: Joi.string().trim().uri().required(),
    apiKey: Joi.string().trim().required(),
  }),
});
