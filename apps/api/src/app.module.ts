import { loadYamlConfig } from "@music-event-connect/core";
import { Logger, Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { seconds, ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { configSchema, type ConfigSchema } from "./config/schema";

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [
        () =>
          loadYamlConfig("config.yaml", configSchema, { nodeEnv: process.env["NODE_ENV"], port: process.env["PORT"] }),
      ],
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
    // TODO: REST API documentation with Swagger (https://docs.nestjs.com/openapi/introduction)
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
