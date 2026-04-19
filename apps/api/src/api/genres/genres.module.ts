import { MapperModule } from "@music-event-connect/core/mappers";
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import type { ConfigSchema } from "../../config/schema";
import { GenresController } from "./genres.controller";
import { GenresService } from "./genres.service";

@Module({
  imports: [
    MapperModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService<ConfigSchema, true>) => ({
        tripleStore: {
          endpointUrl: config.get("tripleStore.endpointUrl", { infer: true }),
          user: config.get("tripleStore.user", { infer: true }),
          password: config.get("tripleStore.password", { infer: true }),
        },
      }),
    }),
  ],
  providers: [GenresService],
  controllers: [GenresController],
})
export class GenresModule {}
