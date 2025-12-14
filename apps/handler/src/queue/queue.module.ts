import { MapperModule } from "@music-event-connect/core/mappers";
import { MusicEventsQueue } from "@music-event-connect/core/queue";
import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import type { ConfigSchema } from "../config/schema";
import { GeocodingModule } from "../geocoding/geocoding.module";
import { MusicEventConsumer } from "./music-event.consumer";

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService<ConfigSchema, true>) => ({
        connection: {
          host: config.get("redis.host", { infer: true }),
          port: config.get("redis.port", { infer: true }),
        },
      }),
    }),
    BullModule.registerQueue({ name: MusicEventsQueue.name }),
    MapperModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService<ConfigSchema, true>) => ({
        tripleStore: {
          endpointUrl: config.get("tripleStore.endpointUrl", { infer: true }),
          updateUrl: config.get("tripleStore.updateUrl", { infer: true }),
          user: config.get("tripleStore.user", { infer: true }),
          password: config.get("tripleStore.password", { infer: true }),
        },
      }),
    }),
    GeocodingModule,
  ],
  providers: [MusicEventConsumer],
  exports: [BullModule],
})
export class QueueModule {}
