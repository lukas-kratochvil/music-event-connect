import { Module } from "@nestjs/common";
import { SharedBrowserService } from "./shared-browser.service";

@Module({
  providers: [SharedBrowserService],
  exports: [SharedBrowserService],
})
export class SharedBrowserModule {}
