import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { SharedBrowserModule } from "../../puppeteer/shared-browser.module";
import { GooutService } from "./goout.service";

@Module({
  imports: [SharedBrowserModule, ConfigModule],
  providers: [GooutService],
  exports: [GooutService],
})
export class GooutModule {}
