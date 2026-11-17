import { SEARCH_LIMITS } from "./public";

export function normalizeRecentQueries(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const queries: string[] = [];
  const seen = new Set<string>();
  for (const item of value) {
    if (typeof item !== "string") continue;
    const query = item.trim();
    const key = query.toLowerCase();
    if (
      query.length < SEARCH_LIMITS.minQueryLength ||
      query.length > SEARCH_LIMITS.maxQueryLength ||
      seen.has(key)
    )
      continue;
    seen.add(key);
    queries.push(query);
    if (queries.length === SEARCH_LIMITS.historyEntries) break;
  }
  return queries;
}
