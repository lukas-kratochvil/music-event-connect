import type { HttpModuleOptionsFactory, HttpModuleOptions } from "@nestjs/axios";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { ConfigSchema } from "../../config/schema";

@Injectable()
// eslint-disable-next-line @darraghor/nestjs-typed/injectable-should-be-provided
export class TicketmasterHttpConfigService implements HttpModuleOptionsFactory {
  constructor(private readonly config: ConfigService<ConfigSchema, true>) {}

  createHttpOptions(): HttpModuleOptions {
    const ticketmasterConfig = this.config.get("ticketmaster", { infer: true });

    if (!ticketmasterConfig) {
      throw new Error("Config not present!");
    }

    return {
      baseURL: ticketmasterConfig.url,
      headers: {
        Accept: "application/json",
      },
      params: {
        apikey: ticketmasterConfig.apiKey,
      },
    };
  }
}
