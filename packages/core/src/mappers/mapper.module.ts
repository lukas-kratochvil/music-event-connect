import { DynamicModule, Module } from "@nestjs/common";
import { RdfEntityDeserializerService } from "../serialization/rdf-entity-deserializer.service";
import { RdfEntitySerializerService } from "../serialization/rdf-entity-serializer.service";
import { SPARQLModule } from "../sparql/sparql.module";
import { MusicEventMapper } from "./events/music-event-mapper.service";
import { LinksMapper } from "./links/links-mapper.service";
import { ConfigurableModuleClass, ASYNC_OPTIONS_TYPE } from "./mapper.module-definition";
import { OSMMapper } from "./osm/osm-mapper.service";

@Module({
  providers: [LinksMapper, MusicEventMapper, OSMMapper, RdfEntitySerializerService, RdfEntityDeserializerService],
  exports: [MusicEventMapper, OSMMapper],
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
