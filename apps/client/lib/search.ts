"use client"

import { isSearchAvailable } from "@repo/search/availability"
import {
  getPublicSearchConnection,
  searchPublicIndexes,
} from "@repo/search/browser"
import type {
  PublicSearchPreview,
  SearchResponse,
} from "@repo/search/contracts"
import { isSearchQueryReady, normalizeSearchQuery } from "@repo/search/query"

export async function searchPublicCatalog(
  value: string,
  signal?: AbortSignal
): Promise<SearchResponse<PublicSearchPreview>> {
  if (!isSearchAvailable(process.env.NODE_ENV))
    return { query: value.trim(), groups: [] }
  const query = normalizeSearchQuery(value)
  signal?.throwIfAborted()
  if (!isSearchQueryReady(query)) return { query, groups: [] }

  const connection = getPublicSearchConnection({
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_MEILISEARCH_URL: process.env.NEXT_PUBLIC_MEILISEARCH_URL,
    NEXT_PUBLIC_MEILISEARCH_SEARCH_KEY:
      process.env.NEXT_PUBLIC_MEILISEARCH_SEARCH_KEY,
  })
  if (!connection.enabled) return { query, groups: [] }
  try {
    return await searchPublicIndexes(connection, query, signal)
  } catch {
    signal?.throwIfAborted()
    throw new Error("Search is unavailable. Please try again.")
  }
}
