import { loadYamlConfig } from "@music-event-connect/core/config";
import { Logger, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { configSchema } from "./config/schema";
import { CronManagerModule } from "./cron/cron-manager.module";
import { QueueModule } from "./queue/queue.module";

const config = loadYamlConfig("config.yaml", configSchema);

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [() => config],
    }),
    ScheduleModule.forRoot(),
    CronManagerModule.register(config),
    QueueModule,
  ],
  providers: [Logger],
})
export class AppModule {}
