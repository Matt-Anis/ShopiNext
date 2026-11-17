import { Meilisearch } from "meilisearch";
import { isSearchAvailable } from "@repo/search/availability";
import { createSearchWorkerDatabase } from "../db/client";
import { loadIndexingConnection } from "../indexing/environment";
import { describeWorkerError } from "../worker/errors";
import { parseReconciliationOptions } from "./options";
import { runReconciliation } from "./run";

async function main() {
  if (!isSearchAvailable(process.env.NODE_ENV)) {
    console.info("Reconciliation skipped: search is unavailable in production.");
    return;
  }
  const options = parseReconciliationOptions(process.argv.slice(2));
  const connection = loadIndexingConnection();
  if (!connection.enabled) return;
  const client = new Meilisearch({ host: connection.url, apiKey: connection.apiKey, timeout: 10_000 });
  const database = createSearchWorkerDatabase(connection.databaseUrl);
  try {
    if (!await runReconciliation(database.db, client, options)) process.exitCode = 1;
  } finally {
    await database.close();
  }
}

main().catch((error: unknown) => {
  console.error(describeWorkerError(error));
  process.exitCode = 1;
});
