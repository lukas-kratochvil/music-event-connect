import { loadYamlConfig } from "@music-event-connect/core";
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
    QueueModule,
  ],
  providers: [Logger],
})
export class AppModule {}
