import assert from "node:assert/strict";
import test from "node:test";
import { parseIndexingOptions } from "./options";

test("initial population is the default and rebuild requires an explicit flag", () => {
  assert.deepEqual(parseIndexingOptions([]), {
    rebuild: false,
    batchSize: 100,
  });
  assert.deepEqual(parseIndexingOptions(["--rebuild", "--batch-size", "25"]), {
    rebuild: true,
    batchSize: 25,
  });
});

test("invalid batch sizes and unknown arguments are rejected", () => {
  for (const size of ["0", "-1", "1.5", "1001", "Infinity", "1e2"]) {
    assert.throws(() => parseIndexingOptions(["--batch-size", size]));
  }
  assert.throws(() => parseIndexingOptions(["--unknown"]));
  assert.throws(() => parseIndexingOptions(["unexpected-positional"]));
});
