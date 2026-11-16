import { fileURLToPath } from "node:url";
import { config } from "dotenv";
import { getServerSearchConnection } from "@repo/search/server/environment";

export function loadIndexingConnection() {
  config({
    path: [
      fileURLToPath(new URL("../../../.env.search.local", import.meta.url)),
      fileURLToPath(
        new URL("../../../.env.search.generated.local", import.meta.url),
      ),
    ],
    quiet: true,
  });
  const connection = getServerSearchConnection(
    {
      NODE_ENV: process.env.NODE_ENV,
      MEILISEARCH_URL: process.env.MEILISEARCH_URL,
      MEILISEARCH_WORKER_KEY: process.env.MEILISEARCH_WORKER_KEY,
    },
    "worker",
  );
  if (!connection.enabled) return connection;

  const databaseUrl = process.env.SEARCH_DATABASE_URL?.trim();
  if (!databaseUrl)
    throw new Error("SEARCH_DATABASE_URL is required for local indexing.");

  return { ...connection, databaseUrl };
}
