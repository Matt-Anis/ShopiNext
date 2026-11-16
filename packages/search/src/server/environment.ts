import { isSearchAvailable } from "../availability";

type SearchEnvironment = {
  NODE_ENV?: string;
  MEILISEARCH_URL?: string;
  MEILISEARCH_ADMIN_SEARCH_KEY?: string;
  MEILISEARCH_WORKER_KEY?: string;
  MEILI_MASTER_KEY?: string;
};

const credentialVariables = {
  adminSearch: "MEILISEARCH_ADMIN_SEARCH_KEY",
  worker: "MEILISEARCH_WORKER_KEY",
  setup: "MEILI_MASTER_KEY",
} as const;

type SearchConnection =
  { enabled: false } | { enabled: true; url: string; apiKey: string };

function requireValue(
  environment: SearchEnvironment,
  name: Exclude<keyof SearchEnvironment, "NODE_ENV">,
): string {
  const value = environment[name]?.trim();
  if (!value) throw new Error(`${name} is required for local search.`);
  return value;
}

export function getServerSearchConnection(
  environment: SearchEnvironment,
  credential: keyof typeof credentialVariables,
): SearchConnection {
  if (!isSearchAvailable(environment.NODE_ENV)) return { enabled: false };

  const url = requireValue(environment, "MEILISEARCH_URL");
  const parsedUrl = new URL(url);
  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    throw new Error("MEILISEARCH_URL must use HTTP or HTTPS.");
  }

  return {
    enabled: true,
    url,
    apiKey: requireValue(environment, credentialVariables[credential]),
  };
}
