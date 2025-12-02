import { DynamicModule, Module } from "@nestjs/common";
import { RdfEntitySerializerService } from "../serialization/rdf-entity-serializer.service";
import { SPARQLModule } from "../sparql/sparql.module";
import { ConfigurableModuleClass, ASYNC_OPTIONS_TYPE } from "./mapper.module-definition";
import { MusicEventMapper } from "./music-event-mapper.service";

@Module({
  providers: [RdfEntitySerializerService, MusicEventMapper],
  exports: [MusicEventMapper],
})
export class MapperModule extends ConfigurableModuleClass {
  static registerAsync(options: typeof ASYNC_OPTIONS_TYPE): DynamicModule {
    return {
      module: MapperModule,
      imports: [
        SPARQLModule.registerAsync({
          imports: options.imports,
          inject: options.inject,
          useFactory: async (...args) => {
            const mapperConfig = await options.useFactory!(...args);
            return { ...mapperConfig.tripleStore };
          },
        }),
      ],
    };
  }
}
