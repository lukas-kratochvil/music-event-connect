import { array, object, string, type InferType } from "yup";
import load from "./loader";

const spotifyScopeSchema = string()
  .trim()
  .matches(/^[a-zA-Z0-9-]+( [a-zA-Z0-9-]+)*$/)
  .required();

const configSchema = object({
  musicEventConnect: object({
    apiUrl: import.meta.env.DEV ? string().trim().required() : string().trim().url().required(),
    sparqlEndpoint: import.meta.env.DEV ? string().trim().required() : string().trim().url().required(),
  }).required(),
  oidc: object({
    spotify: object({
      clientId: string().trim().required(),
      redirectUri: string().trim().url().required(),
      scopes: array().of(spotifyScopeSchema).required(),
    }).required(),
  }).required(),
}).required();

let config: InferType<typeof configSchema>;

export const loadConfig = async () => {
  const conf = await load(configSchema);
  config = conf;
  return config;
};

export const getConfig = () => config;
