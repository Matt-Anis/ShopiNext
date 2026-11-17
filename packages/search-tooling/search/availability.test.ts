import assert from "node:assert/strict";
import test from "node:test";
import { isSearchAvailable } from "@repo/search/availability";
import { getPublicSearchConnection } from "@repo/search/browser";
import { getServerSearchConnection } from "@repo/search/server/environment";

test("NODE_ENV is the only availability switch and production needs no search secrets", () => {
  assert.equal(isSearchAvailable("production"), false);
  for (const environment of ["development", "test", undefined]) {
    assert.equal(isSearchAvailable(environment), true);
  }
  assert.deepEqual(getPublicSearchConnection({ NODE_ENV: "production" }), {
    enabled: false,
  });
  for (const credential of ["adminSearch", "worker", "setup"] as const) {
    assert.deepEqual(
      getServerSearchConnection({ NODE_ENV: "production" }, credential),
      { enabled: false },
    );
  }
});
