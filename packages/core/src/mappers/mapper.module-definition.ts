import { ConfigurableModuleBuilder } from "@nestjs/common";
import type { SPARQLModuleOptions } from "../sparql/sparql.module-definition";

export interface MapperModuleOptions {
  tripleStore: SPARQLModuleOptions;
}

export const { ConfigurableModuleClass, ASYNC_OPTIONS_TYPE } =
  new ConfigurableModuleBuilder<MapperModuleOptions>().build();
