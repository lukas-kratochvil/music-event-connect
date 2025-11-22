import { loadYamlConfig } from "@music-event-connect/core";
import { Logger, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { configSchema } from "./config/schema";

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [
        () =>
          loadYamlConfig("config.yaml", configSchema, { nodeEnv: process.env["NODE_ENV"], port: process.env["PORT"] }),
      ],
    }),
  ],
  providers: [Logger],
})
export class AppModule {}
