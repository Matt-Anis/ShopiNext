import { Meilisearch } from "meilisearch";
import { isSearchAvailable } from "@repo/search/availability";
import { createSearchReadDatabase } from "../db/client";
import { loadIndexingConnection } from "./environment";
import { parseIndexingOptions } from "./options";
import { populateSearchIndexes } from "./run";

async function main() {
  if (!isSearchAvailable(process.env.NODE_ENV)) {
    console.info("Indexing skipped: search is unavailable in production.");
    return;
  }

  const options = parseIndexingOptions(process.argv.slice(2));
  const connection = loadIndexingConnection();
  if (!connection.enabled) return;

  const client = new Meilisearch({
    host: connection.url,
    apiKey: connection.apiKey,
  });
  const database = createSearchReadDatabase(connection.databaseUrl);
  try {
    await populateSearchIndexes(database.db, client, options);
    console.info(
      options.rebuild
        ? "Search rebuild complete."
        : "Search population complete.",
    );
  } finally {
    await database.close();
  }
}

main().catch((error: unknown) => {
  console.error(
    error instanceof Error ? error.message : "Search indexing failed.",
  );
  process.exitCode = 1;
});
