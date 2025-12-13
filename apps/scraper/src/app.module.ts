import { Logger, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { appConfig } from "./config/app-config";
import { CronManagerModule } from "./cron/cron-manager.module";
import { QueueModule } from "./queue/queue.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [() => appConfig],
    }),
    ScheduleModule.forRoot(),
    CronManagerModule.register(appConfig),
    QueueModule,
  ],
  providers: [Logger],
})
export class AppModule {}
