import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { SharedBrowserModule } from "../../puppeteer/shared-browser.module";
import { QueueModule } from "../../queue/queue.module";
import { GooutService } from "./goout.service";

@Module({
  imports: [SharedBrowserModule, ConfigModule, QueueModule],
  providers: [GooutService],
  exports: [GooutService],
})
export class GooutModule {}
