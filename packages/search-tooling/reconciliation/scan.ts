import { isDeepStrictEqual } from "node:util";
import type { DocumentPage, IndexDocument } from "../indexing/pages";

export type ReconciliationSource = {
  readSourcePage: (afterId?: string) => Promise<DocumentPage>;
  readIndexedDocuments: (ids: string[]) => Promise<IndexDocument[]>;
  readIndexedIds: (offset: number) => Promise<IndexDocument[]>;
  readCurrent: (id: string) => Promise<IndexDocument | null>;
  enqueue: (ids: string[]) => Promise<void>;
  heartbeat: () => Promise<void>;
};

export async function scanSource(
  source: ReconciliationSource,
  batchSize: number,
) {
  let documentsChecked = 0;
  let repairsQueued = 0;
  let afterId: string | undefined;
  for (;;) {
    await source.heartbeat();
    const page = await source.readSourcePage(afterId);
    if (page.documents.length > 0) {
      await source.heartbeat();
      const indexed = await source.readIndexedDocuments(page.documents.map((doc) => doc.id));
      const byId = new Map(indexed.map((doc) => [doc.id, doc]));
      const changed = page.documents
        .filter((doc) => !isDeepStrictEqual(doc, byId.get(doc.id)))
        .map((doc) => doc.id);
      await source.enqueue(changed);
      documentsChecked += page.documents.length;
      repairsQueued += changed.length;
    }
    if (page.nextCursor === null) break;
    afterId = page.nextCursor;
  }

  for (let offset = 0; ; offset += batchSize) {
    await source.heartbeat();
    const indexed = await source.readIndexedIds(offset);
    const orphans: string[] = [];
    for (const doc of indexed) {
      await source.heartbeat();
      const id = String(doc.id);
      if (await source.readCurrent(id) === null) orphans.push(id);
    }
    await source.enqueue(orphans);
    documentsChecked += indexed.length;
    repairsQueued += orphans.length;
    if (indexed.length < batchSize) break;
  }
  return { documentsChecked, repairsQueued };
}
