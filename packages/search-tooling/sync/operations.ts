import type { SearchEntityType, SearchOutboxTask } from "@repo/db/admin/schema";
import type { SearchIndexUid } from "@repo/search/server/indexes";
import type { Meilisearch } from "meilisearch";
import type { SearchReadDatabase } from "../db/client";
import type { IndexDocument } from "../indexing/pages";
import { INDEX_SOURCES } from "../indexing/sources";

export type DocumentOperation = {
  indexUid: SearchIndexUid;
  entityId: string;
  document: IndexDocument | null;
};

export async function readEntityOperations(
  db: SearchReadDatabase,
  entityType: SearchEntityType,
  entityId: string,
): Promise<DocumentOperation[]> {
  const operations: DocumentOperation[] = [];
  for (const source of INDEX_SOURCES.filter(
    (entry) => entry.entityType === entityType,
  )) {
    operations.push({
      indexUid: source.uid,
      entityId,
      document: await source.readEntity(db, entityId),
    });
  }
  return operations;
}

export async function submitDocumentOperation(
  client: Meilisearch,
  operation: DocumentOperation,
): Promise<SearchOutboxTask> {
  const index = client.index(operation.indexUid);
  const task =
    operation.document === null
      ? await index.deleteDocument(operation.entityId)
      : await index.addDocuments([operation.document]);
  return {
    indexUid: operation.indexUid,
    taskUid: task.taskUid,
    operation: operation.document === null ? "delete" : "replace",
  };
}
