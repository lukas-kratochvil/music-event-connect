import { Module, type DynamicModule, type Type } from "@nestjs/common";
import type { ConfigSchema, MusicEventServices } from "../config/schema";
import { GooutModule } from "../services/goout/goout.module";
import { GooutService } from "../services/goout/goout.service";
import { TicketmasterModule } from "../services/ticketmaster/ticketmaster.module";
import { TicketmasterService } from "../services/ticketmaster/ticketmaster.service";
import { TicketportalModule } from "../services/ticketportal/ticketportal.module";
import { TicketportalService } from "../services/ticketportal/ticketportal.service";
import { CRON_MANAGER_PROVIDERS } from "./constants";
import { CronManagerService } from "./cron-manager.service";

const services: Record<MusicEventServices, { module: Type; provider: Type }> = {
  goout: {
    module: GooutModule,
    provider: GooutService,
  },
  ticketmaster: {
    module: TicketmasterModule,
    provider: TicketmasterService,
  },
  ticketportal: {
    module: TicketportalModule,
    provider: TicketportalService,
  },
};

@Module({
  providers: [CronManagerService],
  exports: [CronManagerService],
})
export class CronManagerModule {
  static register(config: Pick<ConfigSchema, MusicEventServices>): DynamicModule {
    const definedServices = (Object.keys(services) as (keyof typeof services)[]).filter(
      (serviceName) => config[serviceName] !== undefined
    );
    return {
      module: CronManagerModule,
      imports: definedServices.map((serviceName) => services[serviceName].module),
      providers: [
        {
          provide: CRON_MANAGER_PROVIDERS.cronJobServices,
          useFactory: (...cronJobServices) => cronJobServices,
          inject: definedServices.map((serviceName) => services[serviceName].provider),
        },
      ],
    };
  }
}
