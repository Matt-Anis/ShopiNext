import assert from "node:assert/strict";
import test from "node:test";
import {
  ADMIN_RECENT_SEARCH_PREFIX,
  PUBLIC_RECENT_SEARCH_KEY,
  clearAdminSearchHistory,
  createAdminSearchHistory,
  createPublicSearchHistory,
  createRecentSearchHistory,
} from "@repo/search/browser";

class MemoryStorage implements Storage {
  private values = new Map<string, string>();
  get length() {
    return this.values.size;
  }
  clear() {
    this.values.clear();
  }
  getItem(key: string) {
    return this.values.get(key) ?? null;
  }
  key(index: number) {
    return [...this.values.keys()][index] ?? null;
  }
  removeItem(key: string) {
    this.values.delete(key);
  }
  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

test("history keeps ten recent unique trimmed keywords, never result objects", () => {
  const storage = new MemoryStorage();
  const history = createRecentSearchHistory(() => storage, "history");
  for (let index = 0; index < 12; index += 1)
    history.remember(` term-${index} `);
  history.remember(" TERM-5 ");
  assert.deepEqual(history.read(), [
    "TERM-5",
    "term-11",
    "term-10",
    "term-9",
    "term-8",
    "term-7",
    "term-6",
    "term-4",
    "term-3",
    "term-2",
  ]);
  assert.deepEqual(
    JSON.parse(storage.getItem("history") ?? "null"),
    history.read(),
  );
  assert.deepEqual(history.remove("term-5"), [
    "term-11",
    "term-10",
    "term-9",
    "term-8",
    "term-7",
    "term-6",
    "term-4",
    "term-3",
    "term-2",
  ]);
  history.clear();
  assert.equal(storage.getItem("history"), null);
});

test("malformed, short, oversized, and non-keyword stored entries are ignored", () => {
  const storage = new MemoryStorage();
  const history = createRecentSearchHistory(() => storage, "history");
  storage.setItem("history", "invalid json");
  assert.deepEqual(history.read(), []);
  storage.setItem(
    "history",
    JSON.stringify([
      " shirt ",
      "SHIRT",
      null,
      { title: "a result" },
      "x",
      "x".repeat(201),
    ]),
  );
  assert.deepEqual(history.read(), ["shirt"]);
  assert.deepEqual(history.remember("x"), ["shirt"]);
  assert.deepEqual(history.remember("x".repeat(201)), ["shirt"]);
});

test("blocked storage never throws into search interactions", () => {
  const history = createRecentSearchHistory(() => {
    throw new Error("Storage blocked");
  }, "history");
  assert.deepEqual(history.read(), []);
  assert.deepEqual(history.remember("shirt"), ["shirt"]);
  assert.deepEqual(history.remove("shirt"), []);
  assert.doesNotThrow(() => history.clear());
});

test("admin histories are account-scoped and logout cleanup leaves public and unrelated storage intact", () => {
  const localStorage = new MemoryStorage();
  const sessionStorage = new MemoryStorage();
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, "window");
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { localStorage, sessionStorage },
  });
  try {
    const first = createAdminSearchHistory("account/one");
    const second = createAdminSearchHistory("account-two");
    const publicHistory = createPublicSearchHistory();
    first.remember("private order");
    second.remember("another order");
    publicHistory.remember("shirt");
    sessionStorage.setItem("unrelated", "keep");
    assert.deepEqual(first.read(), ["private order"]);
    assert.deepEqual(second.read(), ["another order"]);
    assert.equal(
      sessionStorage.getItem(`${ADMIN_RECENT_SEARCH_PREFIX}account%2Fone`),
      '["private order"]',
    );
    assert.equal(localStorage.getItem(PUBLIC_RECENT_SEARCH_KEY), '["shirt"]');
    clearAdminSearchHistory();
    assert.deepEqual(first.read(), []);
    assert.deepEqual(second.read(), []);
    assert.deepEqual(publicHistory.read(), ["shirt"]);
    assert.equal(sessionStorage.getItem("unrelated"), "keep");
  } finally {
    if (descriptor) Object.defineProperty(globalThis, "window", descriptor);
    else Reflect.deleteProperty(globalThis, "window");
  }
});
