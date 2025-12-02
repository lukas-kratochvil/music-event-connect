import { Module } from "@nestjs/common";
import { SPARQL_PROVIDERS } from "../constants";
import { SPARQLQueryBuilderService } from "./sparql-query-builder.service";
import { SPARQLUpdateBuilderService } from "./sparql-update-builder.service";
import { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN, type SPARQLModuleOptions } from "./sparql.module-definition";
import { SPARQLService } from "./sparql.service";
import { createDigestFetch, type SparqlBuilderType } from "./util";

@Module({
  providers: [
    {
      provide: SPARQL_PROVIDERS.builder,
      useFactory: async () => (await import("@tpluscode/sparql-builder")) satisfies SparqlBuilderType,
    },
    SPARQLQueryBuilderService,
    SPARQLUpdateBuilderService,
    {
      provide: SPARQL_PROVIDERS.client,
      useFactory: async (options: SPARQLModuleOptions) => {
        const sparqlClient = await import("sparql-http-client");
        return new sparqlClient.StreamClient({
          endpointUrl: options.endpointUrl,
          updateUrl: options.updateUrl,
          // Virtuoso requires Digest Auth method, but sparql-http-client uses Basic Auth
          fetch: createDigestFetch(options.user, options.password),
        });
      },
      inject: [MODULE_OPTIONS_TOKEN],
    },
    SPARQLService,
  ],
  exports: [SPARQLService],
})
export class SPARQLModule extends ConfigurableModuleClass {}
