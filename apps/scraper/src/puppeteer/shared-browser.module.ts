import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { SharedBrowserService } from "./shared-browser.service";

@Module({
  imports: [ConfigModule],
  providers: [SharedBrowserService],
  exports: [SharedBrowserService],
})
export class SharedBrowserModule {}
