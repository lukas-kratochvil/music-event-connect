import { createKeyv } from "@keyv/redis";
import { loadYamlConfig } from "@music-event-connect/core";
import { CacheModule } from "@nestjs/cache-manager";
import { Logger, Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { configSchema, type ConfigSchema } from "./config/schema";
import { QueueModule } from "./queue/queue.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [
        () =>
          loadYamlConfig("config.yaml", configSchema, { nodeEnv: process.env["NODE_ENV"], port: process.env["PORT"] }),
      ],
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService<ConfigSchema, true>) => {
        const redisHost = config.get("redis.host", { infer: true });
        const redisPort = config.get("redis.port", { infer: true });
        const redisUrl = "redis://" + redisHost + ":" + redisPort;
        return {
          stores: [
            // the first defined store is the primary cache
            createKeyv(redisUrl),
          ],
          ttl: 1000 * config.get("redis.cache.ttl", { infer: true }),
        };
      },
    }),
    QueueModule,
  ],
  providers: [Logger],
})
export class AppModule {}
