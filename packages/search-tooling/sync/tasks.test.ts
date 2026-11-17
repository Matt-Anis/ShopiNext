import assert from "node:assert/strict";
import { mock, test } from "node:test";
import { Meilisearch, MeilisearchApiError, type Task } from "meilisearch";
import { settleJobTasks } from "./tasks";

const tasks = [
  { indexUid: "public_products", taskUid: 1, operation: "replace" as const },
  { indexUid: "admin_products", taskUid: 2, operation: "replace" as const },
];

test("a failed task does not skip settling the remaining known tasks", async () => {
  const client = new Meilisearch({ host: "http://search.test" });
  const checked: number[] = [];
  let renewals = 0;
  const waiter = mock.method(
    client.tasks,
    "waitForTask",
    async (uid: number) => {
      checked.push(uid);
      return { status: uid === 1 ? "failed" : "succeeded" } as Task;
    },
  );
  try {
    assert.equal(
      await settleJobTasks(client, tasks, async () => {
        renewals += 1;
      }),
      false,
    );
    assert.deepEqual(checked, [1, 2]);
    assert.equal(renewals, 2);
  } finally {
    waiter.mock.restore();
  }
});

test("an unknown outcome throws even when another task already failed", async () => {
  const client = new Meilisearch({ host: "http://search.test" });
  const waiter = mock.method(
    client.tasks,
    "waitForTask",
    async (uid: number) => {
      if (uid === 2) throw new Error("Task outcome unknown");
      return { status: "failed" } as Task;
    },
  );
  try {
    await assert.rejects(
      settleJobTasks(client, tasks, async () => {}),
      /outcome unknown/u,
    );
  } finally {
    waiter.mock.restore();
  }
});

test("a removed task permits a fresh attempt only after the other task settles", async () => {
  const client = new Meilisearch({ host: "http://search.test" });
  const checked: number[] = [];
  const waiter = mock.method(
    client.tasks,
    "waitForTask",
    async (uid: number) => {
      checked.push(uid);
      if (uid === 1)
        throw new MeilisearchApiError(new Response(null, { status: 404 }), {
          message: "Task not found",
          code: "task_not_found",
          type: "invalid_request",
          link: "https://www.meilisearch.com/docs/reference/errors/error-codes",
        });
      return { status: "succeeded" } as Task;
    },
  );
  try {
    assert.equal(await settleJobTasks(client, tasks, async () => {}), false);
    assert.deepEqual(checked, [1, 2]);
  } finally {
    waiter.mock.restore();
  }
});
