"use client"

import { isSearchAvailable } from "@repo/search/availability"
import type { AdminSearchPreview, SearchResponse } from "@repo/search/contracts"
import { isSearchQueryReady, normalizeSearchQuery } from "@repo/search/query"

export async function searchAdminCatalog(
  value: string,
  signal: AbortSignal
): Promise<SearchResponse<AdminSearchPreview>> {
  if (!isSearchAvailable(process.env.NODE_ENV))
    return { query: value.trim(), groups: [] }
  const query = normalizeSearchQuery(value)
  signal.throwIfAborted()
  if (!isSearchQueryReady(query)) return { query, groups: [] }
  const response = await fetch(
    `/api/search?${new URLSearchParams({ q: query })}`,
    {
      credentials: "same-origin",
      cache: "no-store",
      headers: { Accept: "application/json" },
      signal,
    }
  )
  signal.throwIfAborted()
  if (response.status === 401) throw new Error("Sign in again to search.")
  if (response.status === 403)
    throw new Error("You do not have permission to search.")
  if (!response.ok) throw new Error("Search is unavailable. Please try again.")
  const result = (await response.json()) as SearchResponse<AdminSearchPreview>
  signal.throwIfAborted()
  return result
}
