import type { HttpModuleOptionsFactory, HttpModuleOptions } from "@nestjs/axios";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { ConfigSchema } from "../config/schema";

@Injectable()
// eslint-disable-next-line @darraghor/nestjs-typed/injectable-should-be-provided
export class LocationIQHttpConfigService implements HttpModuleOptionsFactory {
  constructor(private readonly config: ConfigService<ConfigSchema, true>) {}

  createHttpOptions(): HttpModuleOptions {
    return {
      baseURL: this.config.get("locationIQ.url", { infer: true }),
      headers: {
        Accept: "application/json",
      },
      // available request parameters: https://docs.locationiq.com/docs/search-forward-geocoding#request
      params: {
        key: this.config.get("locationIQ.apiKey", { infer: true }),
      },
    };
  }
}
