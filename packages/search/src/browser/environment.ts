import { isSearchAvailable } from "../availability";

type PublicSearchEnvironment = {
  NODE_ENV?: string;
  NEXT_PUBLIC_MEILISEARCH_URL?: string;
  NEXT_PUBLIC_MEILISEARCH_SEARCH_KEY?: string;
};

export function getPublicSearchConnection(
  environment: PublicSearchEnvironment,
) {
  if (!isSearchAvailable(environment.NODE_ENV))
    return { enabled: false } as const;
  const url = environment.NEXT_PUBLIC_MEILISEARCH_URL?.trim();
  const apiKey = environment.NEXT_PUBLIC_MEILISEARCH_SEARCH_KEY?.trim();
  if (!url || !apiKey)
    throw new Error("Local public search is not configured.");
  if (!["http:", "https:"].includes(new URL(url).protocol)) {
    throw new Error("The public search URL must use HTTP or HTTPS.");
  }
  return { enabled: true, url, apiKey } as const;
}
