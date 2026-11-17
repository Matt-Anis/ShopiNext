import { SEARCH_UNAVAILABLE_MESSAGE } from "@repo/search/availability"
import type { AdminSearchPreview, SearchResponse } from "@repo/search/contracts"
import {
  isSearchQueryReady,
  normalizeSearchQuery,
  SearchQueryError,
} from "@repo/search/query"
import type { AdminSearchAccess } from "@repo/search/server/admin-search"
import { getAdminSearchAccess } from "./access"

type SearchSession = { user: { role?: string | null; banned?: boolean | null } }

type SearchHandlerDependencies = {
  isAvailable: () => boolean
  getSession: (headers: Headers) => Promise<SearchSession | null>
  search: (
    query: string,
    access: AdminSearchAccess,
    signal: AbortSignal
  ) => Promise<SearchResponse<AdminSearchPreview>>
}

function json(body: unknown, status = 200): Response {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  })
}

function readQuery(request: Request): string {
  const params = new URL(request.url).searchParams
  if (
    params.getAll("q").length > 1 ||
    [...params.keys()].some((key) => key !== "q")
  ) {
    throw new SearchQueryError("Search accepts a single q parameter.")
  }
  return normalizeSearchQuery(params.get("q") ?? "")
}

export function createAdminSearchHandler(
  dependencies: SearchHandlerDependencies
) {
  return async function GET(request: Request): Promise<Response> {
    if (!dependencies.isAvailable())
      return json({ error: SEARCH_UNAVAILABLE_MESSAGE }, 503)
    try {
      request.signal.throwIfAborted()
      const session = await dependencies.getSession(request.headers)
      if (!session)
        return json({ error: "Sign in to search the admin app." }, 401)
      if (session.user.banned)
        return json({ error: "Search access denied." }, 403)
      const access = getAdminSearchAccess(session.user.role)
      if (access.groups.length === 0)
        return json({ error: "Search access denied." }, 403)
      const query = readQuery(request)
      if (!isSearchQueryReady(query)) return json({ query, groups: [] })
      return json(await dependencies.search(query, access, request.signal))
    } catch (error) {
      if (error instanceof SearchQueryError)
        return json({ error: error.message }, 400)
      if (request.signal.aborted)
        return json({ error: "Search request canceled." }, 408)
      return json({ error: "Search is unavailable. Please try again." }, 503)
    }
  }
}
