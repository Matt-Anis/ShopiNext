import { Meilisearch } from "meilisearch";
import { isSearchAvailable } from "@repo/search/availability";
import { createSearchWorkerDatabase } from "../db/client";
import { loadIndexingConnection } from "../indexing/environment";
import { describeWorkerError } from "../worker/errors";
import { parseSyncOptions } from "./options";
import { runOutboxWorker } from "./run";

async function main() {
  if (!isSearchAvailable(process.env.NODE_ENV)) {
    console.info("Synchronization skipped: search is unavailable in production.");
    return;
  }
  const options = parseSyncOptions(process.argv.slice(2));
  const connection = loadIndexingConnection();
  if (!connection.enabled) return;
  const client = new Meilisearch({ host: connection.url, apiKey: connection.apiKey, timeout: 10_000 });
  const database = createSearchWorkerDatabase(connection.databaseUrl);
  try {
    if (!await runOutboxWorker(database.db, client, options.maxJobs)) process.exitCode = 1;
  } finally {
    await database.close();
  }
}

main().catch((error: unknown) => {
  console.error(describeWorkerError(error));
  process.exitCode = 1;
});
