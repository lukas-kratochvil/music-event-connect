import { Module } from "@nestjs/common";
import { SPARQL_PROVIDERS } from "../constants";
import { SPARQLQueryBuilderService } from "./sparql-query-builder.service";
import { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN, type SPARQLModuleOptions } from "./sparql.module-definition";
import { SPARQLService } from "./sparql.service";
import type { SparqlBuilderType } from "./util";

@Module({
  providers: [
    {
      provide: SPARQL_PROVIDERS.builder,
      useFactory: async () => (await import("@tpluscode/sparql-builder")) satisfies SparqlBuilderType,
    },
    SPARQLQueryBuilderService,
    {
      provide: SPARQL_PROVIDERS.client,
      useFactory: async (options: SPARQLModuleOptions) => {
        const sparqlClient = await import("sparql-http-client");
        return new sparqlClient.StreamClient({
          endpointUrl: options.endpointUrl,
        });
      },
      inject: [MODULE_OPTIONS_TOKEN],
    },
    SPARQLService,
  ],
  exports: [SPARQLService],
})
export class SPARQLModule extends ConfigurableModuleClass {}
