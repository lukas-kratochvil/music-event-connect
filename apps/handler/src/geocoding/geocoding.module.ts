import { HttpModule } from "@nestjs/axios";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { LocationIQApiProxy } from "./locationiq-api-proxy.service";
import { LocationIQApi } from "./locationiq-api.service";
import { LocationIQHttpConfigService } from "./locationiq-http-config.service";

@Module({
  imports: [
    HttpModule.registerAsync({
      imports: [ConfigModule],
      useClass: LocationIQHttpConfigService,
    }),
  ],
  providers: [LocationIQApi, LocationIQApiProxy],
  exports: [LocationIQApiProxy],
})
export class GeocodingModule {}
