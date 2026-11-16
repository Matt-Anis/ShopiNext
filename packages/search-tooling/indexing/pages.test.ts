import assert from "node:assert/strict";
import test from "node:test";
import { projectDocumentPage } from "./pages";

test("a full source page advances even if every document is rejected", () => {
  assert.deepEqual(
    projectDocumentPage([{ id: "a" }, { id: "b" }], 2, () => null),
    {
      documents: [],
      nextCursor: "b",
    },
  );
});

test("a partial or empty source page ends iteration", () => {
  assert.deepEqual(
    projectDocumentPage([{ id: "a" }], 2, (row) => row),
    {
      documents: [{ id: "a" }],
      nextCursor: null,
    },
  );
  assert.deepEqual(
    projectDocumentPage([], 2, () => null),
    {
      documents: [],
      nextCursor: null,
    },
  );
});
