import type { Meilisearch } from "meilisearch";
import type { SearchReadDatabase } from "../db/client";
import { requireSuccessfulTask } from "../meilisearch/tasks";
import type { IndexingOptions } from "./options";
import type { DocumentPage } from "./pages";
import { INDEX_SOURCES, type IndexSource } from "./sources";

type IndexPlan = { source: IndexSource; firstPage: DocumentPage };

async function prepareIndexPlans(
  db: SearchReadDatabase,
  client: Meilisearch,
  batchSize: number,
) {
  const plans: IndexPlan[] = [];
  for (const source of INDEX_SOURCES) {
    const index = await client.getRawIndex(source.uid);
    if (index.primaryKey !== "id") {
      throw new Error(
        `Index ${source.uid} must use primary key "id". Run pnpm search:setup first.`,
      );
    }
    const firstPage = await source.readPage(db, { limit: batchSize });
    plans.push({ source, firstPage });
  }
  return plans;
}

export async function populateSearchIndexes(
  db: SearchReadDatabase,
  client: Meilisearch,
  options: IndexingOptions,
) {
  const plans = await prepareIndexPlans(db, client, options.batchSize);
  for (const { source, firstPage } of plans) {
    const index = client.index(source.uid);
    if (options.rebuild) {
      await requireSuccessfulTask(
        index.deleteAllDocuments(),
        `Clearing ${source.uid}`,
      );
    }

    let page = firstPage;
    let indexedCount = 0;
    for (;;) {
      if (page.documents.length > 0) {
        await requireSuccessfulTask(
          index.addDocuments(page.documents),
          `Populating ${source.uid}`,
        );
        indexedCount += page.documents.length;
      }
      if (page.nextCursor === null) break;
      page = await source.readPage(db, {
        afterId: page.nextCursor,
        limit: options.batchSize,
      });
    }
    console.info(`${source.uid}: ${indexedCount} documents indexed.`);
  }
}
