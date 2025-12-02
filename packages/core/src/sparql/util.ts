import { Logger } from "@nestjs/common";
import type * as SparqlBuilder from "@tpluscode/sparql-builder" with { "resolution-mode": "import" };
import DigestClient from "digest-fetch";

export type SparqlBuilderType = typeof SparqlBuilder;

/**
 * Creates the request fetcher that uses Digest Auth.
 */
export const createDigestFetch = (user: string, password: string) => {
  const digestClient = new DigestClient(user, password);
  const logger = new Logger("DigestFetchClient");
  return async (input: RequestInfo | URL, opts?: RequestInit) => {
    const url = input instanceof URL ? input.toString() : input;

    try {
      const response = await digestClient.fetch(url, opts);
      if (response.status === 401) {
        logger.error("[401 Challenge] Server expects: " + response.headers.get("www-authenticate"));
      }
      return response;
    } catch (error) {
      logger.error("[Fetch Error] " + (error instanceof Error ? error.message : error));
      throw error;
    }
  };
};
