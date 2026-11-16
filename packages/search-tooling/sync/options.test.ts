import assert from "node:assert/strict";
import test from "node:test";
import { parseSyncOptions } from "./options";

test("sync uses a bounded default and accepts an explicit job bound", () => {
  assert.deepEqual(parseSyncOptions([]), { maxJobs: 100 });
  assert.deepEqual(parseSyncOptions(["--max-jobs", "5"]), { maxJobs: 5 });
});

test("invalid or unknown sync options are rejected", () => {
  for (const value of ["0", "-1", "1.2", "10001", "1e2", "Infinity"]) {
    assert.throws(() => parseSyncOptions(["--max-jobs", value]));
  }
  assert.throws(() => parseSyncOptions(["--unknown"]));
});
