import assert from "node:assert/strict";
import test from "node:test";
import type { ReconciliationSource } from "./scan";
import { scanSource } from "./scan";

test("equal counts still repair missing, changed, and orphaned documents", async () => {
  const expected = [{ id: "a", name: "updated" }, { id: "b", name: "new" }];
  const indexed = [{ id: "a", name: "old" }, { id: "c", name: "orphan" }];
  const queued: string[] = [];
  const source: ReconciliationSource = {
    async heartbeat() {},
    async readSourcePage() { return { documents: expected, nextCursor: null }; },
    async readIndexedDocuments(ids) { return indexed.filter((doc) => ids.includes(doc.id)); },
    async readIndexedIds(offset) { return indexed.slice(offset, offset + 2); },
    async readCurrent(id) { return expected.find((doc) => doc.id === id) ?? null; },
    async enqueue(ids) { queued.push(...ids); },
  };
  await scanSource(source, 2);
  assert.deepEqual(queued, ["a", "b", "c"]);
});

test("an empty source still scans every orphan page without deleting during scanning", async () => {
  const queued: string[] = [];
  const ids = ["a", "b", "c"];
  const source: ReconciliationSource = {
    async heartbeat() {},
    async readSourcePage() { return { documents: [], nextCursor: null }; },
    async readIndexedDocuments() { throw new Error("No source IDs should be fetched"); },
    async readIndexedIds(offset) { return ids.slice(offset, offset + 2).map((id) => ({ id })); },
    async readCurrent() { return null; },
    async enqueue(page) { queued.push(...page); },
  };
  await scanSource(source, 2);
  assert.deepEqual(queued, ids);
});

test("key order does not trigger repairs and filtered pages still advance", async () => {
  const cursors: (string | undefined)[] = [];
  const queued: string[] = [];
  const source: ReconciliationSource = {
    async heartbeat() {},
    async readSourcePage(cursor) {
      cursors.push(cursor);
      return cursor === undefined
        ? { documents: [], nextCursor: "filtered" }
        : { documents: [{ id: "a", name: "same" }], nextCursor: null };
    },
    async readIndexedDocuments() { return [{ name: "same", id: "a" }]; },
    async readIndexedIds() { return []; },
    async readCurrent() { return null; },
    async enqueue(ids) { queued.push(...ids); },
  };
  await scanSource(source, 2);
  assert.deepEqual(cursors, [undefined, "filtered"]);
  assert.deepEqual(queued, []);
});
