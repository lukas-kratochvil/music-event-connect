import { loadYamlConfig } from "@music-event-connect/core/config";
import { Logger, Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { seconds, ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { EventsModule } from "./api/events/events.module";
import { GenresModule } from "./api/genres/genres.module";
import { configSchema, type ConfigSchema } from "./config/schema";

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [() => loadYamlConfig("config.yaml", configSchema)],
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService<ConfigSchema, true>) => [
        {
          ttl: seconds(config.get("throttler.ttl", { infer: true })),
          limit: config.get("throttler.limit", { infer: true }),
        },
      ],
    }),
    // TODO: caching with Redis (https://docs.nestjs.com/techniques/caching)
    EventsModule,
    GenresModule,
  ],
  providers: [
    Logger,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
