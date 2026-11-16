import { fileURLToPath } from "node:url";
import { config } from "dotenv";
import { Meilisearch } from "meilisearch";
import { isSearchAvailable } from "@repo/search/availability";
import { getServerSearchConnection } from "@repo/search/server/environment";
import { initializeCredentials } from "./credentials";
import { initializeIndexes } from "./indexes";
import { writeSearchEnvironment } from "./write-environment";

async function main() {
  if (!isSearchAvailable(process.env.NODE_ENV)) {
    console.info("Search setup skipped: search is unavailable in production.");
    return;
  }

  config({
    path: fileURLToPath(new URL("../../../.env.search.local", import.meta.url)),
    quiet: true,
  });

  const connection = getServerSearchConnection(
    {
      NODE_ENV: process.env.NODE_ENV,
      MEILISEARCH_URL: process.env.MEILISEARCH_URL,
      MEILI_MASTER_KEY: process.env.MEILI_MASTER_KEY,
    },
    "setup",
  );
  if (!connection.enabled) return;

  const keyClient = new Meilisearch({
    host: connection.url,
    apiKey: connection.apiKey,
  });
  const credentials = await initializeCredentials(keyClient);
  const setupClient = new Meilisearch({
    host: connection.url,
    apiKey: credentials.setupKey,
  });

  await initializeIndexes(setupClient);
  await writeSearchEnvironment(connection.url, credentials);

  console.info(
    "Scoped credentials saved to .env.search.generated.local (not printed).",
  );
  console.info(
    "Search setup complete. Indexes are not populated by this command.",
  );
}

main().catch((error: unknown) => {
  console.error(
    error instanceof Error ? error.message : "Search setup failed.",
  );
  process.exitCode = 1;
});
