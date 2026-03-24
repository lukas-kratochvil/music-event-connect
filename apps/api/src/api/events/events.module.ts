import { MapperModule } from "@music-event-connect/core/mappers";
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import type { ConfigSchema } from "../../config/schema";
import { EventsController } from "./events.controller";
import { EventsService } from "./events.service";

@Module({
  imports: [
    MapperModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService<ConfigSchema, true>) => ({
        tripleStore: {
          endpointUrl: config.get("tripleStore.endpointUrl", { infer: true }),
          user: config.get("tripleStore.user", { infer: true }),
          password: config.get("tripleStore.password", { infer: true }),
        },
      }),
    }),
  ],
  providers: [EventsService],
  controllers: [EventsController],
})
export class EventsModule {}
