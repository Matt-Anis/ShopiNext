import { writeFile } from "node:fs/promises";
import type { SearchCredentials } from "./credentials";

export async function writeSearchEnvironment(
  url: string,
  credentials: SearchCredentials,
) {
  const variables = {
    MEILISEARCH_URL: url,
    MEILISEARCH_ADMIN_SEARCH_KEY: credentials.adminSearchKey,
    MEILISEARCH_WORKER_KEY: credentials.workerKey,
    NEXT_PUBLIC_MEILISEARCH_URL: url,
    NEXT_PUBLIC_MEILISEARCH_SEARCH_KEY: credentials.publicSearchKey,
  };
  const contents = Object.entries(variables)
    .map(([name, value]) => `${name}=${JSON.stringify(value)}`)
    .join("\n");

  await writeFile(
    new URL("../../../.env.search.generated.local", import.meta.url),
    `${contents}\n`,
    { mode: 0o600 },
  );
}
