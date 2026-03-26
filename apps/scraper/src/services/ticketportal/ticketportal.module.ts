import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { SharedBrowserModule } from "../../puppeteer/shared-browser.module";
import { QueueModule } from "../../queue/queue.module";
import { TicketportalService } from "./ticketportal.service";

@Module({
  imports: [SharedBrowserModule, ConfigModule, QueueModule],
  providers: [TicketportalService],
  exports: [TicketportalService],
})
export class TicketportalModule {}
