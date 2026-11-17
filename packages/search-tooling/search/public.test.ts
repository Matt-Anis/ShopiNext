import assert from "node:assert/strict";
import { mock, test } from "node:test";
import {
  getPublicSearchConnection,
  searchPublicIndexes,
} from "@repo/search/browser";
import { normalizeSearchQuery } from "@repo/search/query";

const connection = { url: "http://search.test", apiKey: "public-test-key" };

test("public search uses only public indexes and allowlisted text previews", async () => {
  const requests: {
    queries: { indexUid: string; limit: number; q: string }[];
  }[] = [];
  const fetchMock = mock.method(globalThis, "fetch", async (
    _input: Parameters<typeof fetch>[0],
    init?: RequestInit,
  ) => {
    requests.push(JSON.parse(String(init?.body)));
    return Response.json({
      results: [
        {
          indexUid: "public_products",
          hits: [
            {
              id: "product-id",
              name: "Shirt",
              slug: "a/shirt",
              description: "A shirt",
              thumbnailUrl: null,
              categoryNames: [],
              privateField: "must-not-be-forwarded",
              _formatted: { description: "<img src=x> A \uE000shirt\uE001" },
              _matchesPosition: { description: [{ start: 2, length: 5 }] },
            },
          ],
        },
        { indexUid: "public_categories", hits: [] },
        { indexUid: "admin_orders", hits: [{ id: "private-order" }] },
      ],
    });
  });
  try {
    const response = await searchPublicIndexes(connection, "  shirt  ");
    assert.deepEqual(
      requests[0]?.queries.map(({ indexUid, limit, q }) => ({
        indexUid,
        limit,
        q,
      })),
      [
        { indexUid: "public_products", limit: 5, q: "shirt" },
        { indexUid: "public_categories", limit: 5, q: "shirt" },
      ],
    );
    assert.equal(response.groups.length, 2);
    const preview = response.groups[0]?.results[0];
    assert.equal(preview?.href, "/products/a%2Fshirt");
    assert.equal("privateField" in (preview ?? {}), false);
    assert.deepEqual(preview?.excerpt?.segments, [
      { text: "<img src=x> A ", matched: false },
      { text: "shirt", matched: true },
    ]);
  } finally {
    fetchMock.mock.restore();
  }
});

test("short, oversized, and aborted queries issue no search requests", async () => {
  const fetchMock = mock.method(globalThis, "fetch", async () => {
    throw new Error("No request expected");
  });
  try {
    assert.deepEqual(await searchPublicIndexes(connection, " a "), {
      query: "a",
      groups: [],
    });
    await assert.rejects(searchPublicIndexes(connection, "x".repeat(201)));
    const controller = new AbortController();
    controller.abort();
    await assert.rejects(
      searchPublicIndexes(connection, "shirt", controller.signal),
    );
    assert.equal(fetchMock.mock.callCount(), 0);
    assert.equal(normalizeSearchQuery("  shirt  "), "shirt");
  } finally {
    fetchMock.mock.restore();
  }
});

test("production public configuration needs no URL or key", () => {
  assert.deepEqual(getPublicSearchConnection({ NODE_ENV: "production" }), {
    enabled: false,
  });
});
