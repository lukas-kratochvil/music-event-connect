import { ConfigurableModuleBuilder } from "@nestjs/common";

export interface SPARQLModuleOptions {
  endpointUrl: string;
  updateUrl: string;
  user: string;
  password: string;
}

export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN }
  = new ConfigurableModuleBuilder<SPARQLModuleOptions>().build();
