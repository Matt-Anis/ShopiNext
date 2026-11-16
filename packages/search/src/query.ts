import { SEARCH_LIMITS } from "./public";

export class SearchQueryError extends Error {}

export function normalizeSearchQuery(value: string): string {
  const query = value.trim();
  if (query.length > SEARCH_LIMITS.maxQueryLength) {
    throw new SearchQueryError(
      `Search queries must be at most ${SEARCH_LIMITS.maxQueryLength} characters.`,
    );
  }
  return query;
}

export function isSearchQueryReady(query: string): boolean {
  return query.length >= SEARCH_LIMITS.minQueryLength;
}
