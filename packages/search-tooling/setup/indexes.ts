import {
  MeilisearchApiError,
  type EnqueuedTaskPromise,
  type Meilisearch,
} from "meilisearch";
import {
  SEARCH_INDEX_UIDS,
  type SearchIndexUid,
} from "@repo/search/server/indexes";
import { SEARCH_INDEX_SETTINGS } from "@repo/search/server/settings";

async function requireSuccessfulTask(
  task: EnqueuedTaskPromise,
  operation: string,
) {
  const completed = await task.waitTask({ timeout: 60_000, interval: 250 });
  if (completed.status !== "succeeded") {
    throw new Error(
      `${operation} ${completed.status}: ${completed.error?.message ?? "Indexing task did not succeed."}`,
    );
  }
}

async function ensureIndex(client: Meilisearch, uid: SearchIndexUid) {
  let index;
  try {
    index = await client.getRawIndex(uid);
  } catch (error) {
    if (
      !(error instanceof MeilisearchApiError) ||
      error.cause?.code !== "index_not_found"
    ) {
      throw error;
    }
    await requireSuccessfulTask(
      client.createIndex(uid, { primaryKey: "id" }),
      `Creating ${uid}`,
    );
    return;
  }

  if (index.primaryKey !== "id") {
    throw new Error(
      `Index ${uid} must have primary key "id". Existing documents were not changed.`,
    );
  }
}

export async function initializeIndexes(client: Meilisearch) {
  for (const uid of SEARCH_INDEX_UIDS) {
    await ensureIndex(client, uid);
    await requireSuccessfulTask(
      client.index(uid).updateSettings(SEARCH_INDEX_SETTINGS[uid]),
      `Configuring ${uid}`,
    );
    console.info(`Index ready: ${uid}`);
  }
}
