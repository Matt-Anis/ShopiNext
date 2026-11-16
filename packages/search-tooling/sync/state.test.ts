import assert from "node:assert/strict";
import test from "node:test";
import { drizzle } from "drizzle-orm/node-postgres";
import type { Pool } from "pg";
import * as publicSchema from "@repo/db/public/schema";
import * as publicAuthSchema from "@repo/db/public/auth-schema";
import * as adminSchema from "@repo/db/admin/schema";
import * as adminAuthSchema from "@repo/db/admin/auth-schema";
import { LeaseLostError } from "../worker/errors";
import type { ClaimedJob } from "./jobs";
import { acknowledgeJob, saveJobTasks } from "./state";
import { retryJob } from "./retry";

type RecordedQuery = { text: string; params: unknown[] };

function fixture(results: number[]) {
  const job: ClaimedJob = {
    id: "7089cc26-688a-4384-9b28-a6102115859c",
    entityType: "product",
    entityId: "e7465f6d-eb1f-46a8-b844-632158b371fd",
    version: 5,
    taskVersion: 4,
    tasks: [],
    attempts: 2,
    leaseToken: "344bc00f-a14f-4811-b9f9-b62b21f16e0b",
    leaseExpiresAt: new Date(),
    availableAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    lastError: null,
  };
  const queries: RecordedQuery[] = [];
  const client = {
    async query(config: { text: string }, params: unknown[]) {
      queries.push({ text: config.text, params });
      return { rows: results.shift() ? [[job.id]] : [] };
    },
  };
  const db = drizzle(client as unknown as Pool, {
    schema: {
      ...publicSchema,
      ...publicAuthSchema,
      ...adminSchema,
      ...adminAuthSchema,
    },
  });
  return { db, job, queries };
}

function assertBinding(
  query: RecordedQuery,
  predicate: RegExp,
  expected: unknown,
) {
  const match = query.text.split(" where ")[1]?.match(predicate);
  assert.ok(match, "Expected a fenced WHERE predicate");
  assert.deepEqual(query.params[Number(match[1]) - 1], expected);
}

function assertOwner(query: RecordedQuery, job: ClaimedJob) {
  assertBinding(query, /"id" = \$(\d+)/u, job.id);
  assertBinding(query, /"leaseToken" = \$(\d+)/u, job.leaseToken);
  assert.match(query.text, /"leaseExpiresAt" > clock_timestamp\(\)/u);
}

test("acknowledgement fences deletion by task version and preserves a newer queued version", async () => {
  const { db, job, queries } = fixture([0, 1]);
  await acknowledgeJob(db, job);
  assert.equal(queries.length, 2);
  assertOwner(queries[0]!, job);
  assertBinding(queries[0]!, /"version" = \$(\d+)/u, 4);
  assertBinding(queries[0]!, /"taskVersion" = \$(\d+)/u, 4);
  assertOwner(queries[1]!, job);
  assertBinding(queries[1]!, /"version" > \$(\d+)/u, 4);
  const assignments = queries[1]!.text.split(" where ")[0]!;
  assert.equal(assignments.includes('"availableAt"'), false);
  assert.equal(assignments.includes('"lastError"'), false);
});

test("a stale owner cannot acknowledge or discard saved tasks", async () => {
  const { db, job, queries } = fixture([0, 0, 0]);
  await assert.rejects(acknowledgeJob(db, job), LeaseLostError);
  await assert.rejects(
    saveJobTasks(db, job, [
      { indexUid: "public_products", taskUid: 1, operation: "replace" },
    ]),
    LeaseLostError,
  );
  assert.deepEqual(job.tasks, []);
  for (const query of queries) assertOwner(query, job);
  assertBinding(queries[2]!, /"taskVersion" = \$(\d+)/u, 4);
});

test("late failure releases ownership without overwriting a newer enqueue's retry state", async () => {
  const { db, job, queries } = fixture([0, 1]);
  await retryJob(db, job, new Error("private database credential"));
  assertBinding(queries[0]!, /"version" = \$(\d+)/u, job.version);
  assertOwner(queries[1]!, job);
  const assignments = queries[1]!.text.split(" where ")[0]!;
  for (const field of [
    "availableAt",
    "lastError",
    "attempts",
    "tasks",
    "taskVersion",
  ]) {
    assert.equal(assignments.includes(`"${field}"`), false);
  }
  assert.equal(
    JSON.stringify(queries).includes("private database credential"),
    false,
  );
});
