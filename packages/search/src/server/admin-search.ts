import { Meilisearch, type MultiSearchParams } from "meilisearch";
import type { AdminSearchPreview, SearchResponse } from "../contracts";
import { SEARCH_LIMITS } from "../public";
import { isSearchQueryReady, normalizeSearchQuery } from "../query";
import {
  adminIndexUid,
  adminSearchQueries,
  type AdminSearchAccess,
} from "./admin-queries";
import { adminPreview, type AdminSearchDocument } from "./admin-previews";

export type { AdminSearchAccess, AdminSearchGroup } from "./admin-queries";

export async function searchAdminIndexes(
  connection: { url: string; apiKey: string },
  value: string,
  access: AdminSearchAccess,
  signal?: AbortSignal,
): Promise<SearchResponse<AdminSearchPreview>> {
  const query = normalizeSearchQuery(value);
  signal?.throwIfAborted();
  if (!isSearchQueryReady(query) || access.groups.length === 0)
    return { query, groups: [] };
  const client = new Meilisearch({
    host: connection.url,
    apiKey: connection.apiKey,
    timeout: 5_000,
  });
  const response = await client.multiSearch<
    MultiSearchParams,
    AdminSearchDocument
  >(
    {
      queries: adminSearchQueries(query, access),
    },
    { signal },
  );
  signal?.throwIfAborted();
  return {
    query,
    groups: [...new Set(access.groups)].map((type) => ({
      type,
      results: (
        response.results.find(
          (result) => result.indexUid === adminIndexUid(type),
        )?.hits ?? []
      )
        .slice(0, SEARCH_LIMITS.resultsPerGroup)
        .map((hit) => adminPreview(type, hit, access.maskEmail)),
    })),
  };
}
