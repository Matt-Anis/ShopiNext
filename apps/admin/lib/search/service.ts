import "server-only"

import type { AdminSearchPreview, SearchResponse } from "@repo/search/contracts"
import { getServerSearchConnection } from "@repo/search/server/environment"
import {
  searchAdminIndexes,
  type AdminSearchAccess,
} from "@repo/search/server/admin-search"

export async function searchAdminCatalog(
  query: string,
  access: AdminSearchAccess,
  signal: AbortSignal
): Promise<SearchResponse<AdminSearchPreview>> {
  const connection = getServerSearchConnection(
    {
      NODE_ENV: process.env.NODE_ENV,
      MEILISEARCH_URL: process.env.MEILISEARCH_URL,
      MEILISEARCH_ADMIN_SEARCH_KEY: process.env.MEILISEARCH_ADMIN_SEARCH_KEY,
    },
    "adminSearch"
  )
  if (!connection.enabled) return { query, groups: [] }
  return searchAdminIndexes(connection, query, access, signal)
}
