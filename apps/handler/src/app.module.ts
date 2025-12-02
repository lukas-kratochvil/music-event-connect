import { loadYamlConfig } from "@music-event-connect/core";
import { MapperModule } from "@music-event-connect/core/mappers";
import { Logger, Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { configSchema, type ConfigSchema } from "./config/schema";
import { MusicEventConsumer } from "./queue/music-event.consumer";
import { QueueModule } from "./queue/queue.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [
        () =>
          loadYamlConfig("config.yaml", configSchema, { nodeEnv: process.env["NODE_ENV"], port: process.env["PORT"] }),
      ],
    }),
    QueueModule,
    MapperModule.registerAsync({
      useFactory: (config: ConfigService<ConfigSchema, true>) => ({
        tripleStore: {
          endpointUrl: config.get("tripleStore.endpointUrl", { infer: true }),
          updateUrl: config.get("tripleStore.updateUrl", { infer: true }),
          user: config.get("tripleStore.user", { infer: true }),
          password: config.get("tripleStore.password", { infer: true }),
        },
      }),
      imports: [ConfigModule],
      inject: [ConfigService],
    }),
  ],
  providers: [Logger, MusicEventConsumer],
})
export class AppModule {}
