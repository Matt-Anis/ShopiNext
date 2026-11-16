import type { Meilisearch } from "meilisearch";
import type { SearchReadDatabase } from "../db/client";
import { INDEX_SOURCES } from "../indexing/sources";
import type { IndexDocument } from "../indexing/pages";
import { syncOutbox } from "../sync/run";
import { runSearchWorker } from "../worker/run";
import { enqueueRepairs } from "./enqueue";
import { scanSource } from "./scan";
import type { ReconciliationOptions } from "./options";

export function runReconciliation(
  db: SearchReadDatabase,
  client: Meilisearch,
  options: ReconciliationOptions,
) {
  return runSearchWorker(db, "reconcile", async (context) => {
    for (const source of INDEX_SOURCES) {
      const index = client.index(source.uid);
      const result = await scanSource({
        heartbeat: context.heartbeat,
        readSourcePage: (afterId) => source.readPage(db, { afterId, limit: options.batchSize }),
        async readIndexedDocuments(ids) {
          // An empty filter selects the SDK's POST fetch path, keeping IDs out of URLs.
          const page = await index.getDocuments<IndexDocument>({ ids, limit: ids.length, filter: [] });
          return page.results;
        },
        async readIndexedIds(offset) {
          const page = await index.getDocuments<IndexDocument>({ offset, limit: options.batchSize, fields: ["id"] });
          return page.results;
        },
        readCurrent: (id) => source.readEntity(db, id),
        enqueue: (ids) => enqueueRepairs(db, source.entityType, ids),
      }, options.batchSize);
      context.counts.documentsChecked += result.documentsChecked;
      console.info(`${source.uid}: ${result.repairsQueued} entity refreshes queued.`);
    }
    await syncOutbox(db, client, context, options.maxJobs);
  });
}
