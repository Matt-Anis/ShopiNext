import assert from "node:assert/strict";
import { mock, test } from "node:test";
import type { MultiSearchParams } from "meilisearch";
import { searchAdminIndexes } from "@repo/search/server/admin-search";
import { getAdminSearchAccess } from "../../../apps/admin/lib/search/access";
import { createAdminSearchHandler } from "../../../apps/admin/lib/search/handler";

test("search groups follow the existing role permissions", () => {
  assert.deepEqual(getAdminSearchAccess("owner").groups, [
    "product",
    "category",
    "order",
    "customer",
    "staff",
  ]);
  assert.deepEqual(getAdminSearchAccess("manager").groups, [
    "product",
    "category",
    "order",
    "customer",
    "staff",
  ]);
  assert.deepEqual(getAdminSearchAccess("staff").groups, [
    "product",
    "category",
    "order",
    "customer",
  ]);
  assert.deepEqual(getAdminSearchAccess("demo").groups, [
    "product",
    "category",
    "order",
    "customer",
  ]);
  assert.deepEqual(getAdminSearchAccess("unknown").groups, []);
  assert.deepEqual(getAdminSearchAccess(null).groups, []);
});

test("demo searches exclude email matching and never return raw or formatted email fields", async () => {
  const requests: MultiSearchParams[] = [];
  const fetchMock = mock.method(
    globalThis,
    "fetch",
    async (_input: Parameters<typeof fetch>[0], init?: RequestInit) => {
      requests.push(JSON.parse(String(init?.body)));
      return Response.json({
        results: [
          {
            indexUid: "admin_orders",
            hits: [
              {
                id: "order-id",
                reference: "order-id",
                checkoutEmail: "private@example.test",
                status: "pending",
                totalAmount: 1500,
                createdAt: "2026-01-01T00:00:00.000Z",
                archivedAt: null,
                _formatted: { checkoutEmail: "private@example.test" },
                _matchesPosition: { checkoutEmail: [{ start: 0, length: 7 }] },
                internalNote: "must-not-be-returned",
              },
            ],
          },
          {
            indexUid: "admin_customers",
            hits: [
              {
                id: "customer-id",
                name: "Customer",
                email: "private@example.test",
                image: null,
              },
            ],
          },
          { indexUid: "admin_staff", hits: [{ id: "private-staff" }] },
        ],
      });
    },
  );
  try {
    const response = await searchAdminIndexes(
      { url: "http://search.test", apiKey: "admin-test-key" },
      "customer",
      getAdminSearchAccess("demo"),
    );
    const queries = requests[0]?.queries ?? [];
    assert.equal(
      queries.some((query) => query.indexUid === "admin_staff"),
      false,
    );
    for (const query of queries) {
      assert.equal(query.attributesToSearchOn?.includes("email"), false);
      assert.equal(
        query.attributesToSearchOn?.includes("checkoutEmail"),
        false,
      );
      assert.equal(query.limit, 5);
    }
    const serialized = JSON.stringify(response);
    assert.equal(serialized.includes("private@example.test"), false);
    assert.equal(serialized.includes("_formatted"), false);
    assert.equal(serialized.includes("_matchesPosition"), false);
    assert.equal(serialized.includes("internalNote"), false);
    assert.equal(serialized.includes("private-staff"), false);
  } finally {
    fetchMock.mock.restore();
  }
});

function handlerFixture(role: string | null = "staff") {
  let sessionCalls = 0;
  let searchCalls = 0;
  let queriedGroups: string[] = [];
  const handler = createAdminSearchHandler({
    isAvailable: () => true,
    async getSession() {
      sessionCalls += 1;
      return role === null ? null : { user: { role } };
    },
    async search(query, access) {
      searchCalls += 1;
      queriedGroups = access.groups;
      return { query, groups: [] };
    },
  });
  return {
    handler,
    calls: () => ({ sessionCalls, searchCalls, queriedGroups }),
  };
}

test("admin search authenticates once and passes only authorized groups", async () => {
  const fixture = handlerFixture();
  const response = await fixture.handler(
    new Request("http://admin.test/api/search?q=shirt"),
  );
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  assert.deepEqual(fixture.calls(), {
    sessionCalls: 1,
    searchCalls: 1,
    queriedGroups: ["product", "category", "order", "customer"],
  });
});

test("unauthenticated and unauthorized requests never reach search", async () => {
  for (const [role, status] of [
    [null, 401],
    ["unknown", 403],
  ] as const) {
    const fixture = handlerFixture(role);
    const response = await fixture.handler(
      new Request("http://admin.test/api/search?q=shirt"),
    );
    assert.equal(response.status, status);
    assert.equal(fixture.calls().searchCalls, 0);
  }
});

test("invalid parameters are rejected and short queries do not call the engine", async () => {
  for (const params of [
    "q=shirt&index=admin_staff",
    "q=a&q=b",
    `q=${"x".repeat(201)}`,
  ]) {
    const fixture = handlerFixture();
    const response = await fixture.handler(
      new Request(`http://admin.test/api/search?${params}`),
    );
    assert.equal(response.status, 400);
    assert.equal(fixture.calls().searchCalls, 0);
  }
  const fixture = handlerFixture();
  assert.equal(
    (await fixture.handler(new Request("http://admin.test/api/search?q=a")))
      .status,
    200,
  );
  assert.equal(fixture.calls().searchCalls, 0);
});

test("production disabling happens before session or search access", async () => {
  const handler = createAdminSearchHandler({
    isAvailable: () => false,
    async getSession() {
      throw new Error("Must not authenticate");
    },
    async search() {
      throw new Error("Must not search");
    },
  });
  assert.equal(
    (await handler(new Request("http://admin.test/api/search?q=shirt"))).status,
    503,
  );
});

test("banned sessions never reach the search engine", async () => {
  const handler = createAdminSearchHandler({
    isAvailable: () => true,
    async getSession() {
      return { user: { role: "owner", banned: true } };
    },
    async search() {
      throw new Error("Must not search");
    },
  });
  assert.equal(
    (await handler(new Request("http://admin.test/api/search?q=shirt"))).status,
    403,
  );
});

test("engine failures return a generic error without sensitive details", async () => {
  const handler = createAdminSearchHandler({
    isAvailable: () => true,
    async getSession() {
      return { user: { role: "owner" } };
    },
    async search() {
      throw new Error("private engine credential");
    },
  });
  const response = await handler(
    new Request("http://admin.test/api/search?q=shirt"),
  );
  assert.equal(response.status, 503);
  assert.equal(
    (await response.text()).includes("private engine credential"),
    false,
  );
});
