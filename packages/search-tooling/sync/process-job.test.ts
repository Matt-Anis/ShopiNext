import assert from "node:assert/strict";
import test from "node:test";
import type { SearchOutboxTask } from "@repo/db/admin/schema";
import type { ClaimedJob } from "./jobs";
import type { DocumentOperation } from "./operations";
import { processClaimedJob, type JobProcessor } from "./process-job";
import { retryDelaySeconds } from "./retry";
import { LeaseLostError } from "../worker/errors";

function fixture(version = 1, taskVersion = version) {
  const job: ClaimedJob = {
    id: "b625d844-d14e-49fa-b541-ebdf32ffbe35",
    entityType: "product",
    entityId: "21d4027e-d667-436c-9587-0b2cec6d66d0",
    version,
    taskVersion,
    tasks: [],
    attempts: 1,
    leaseToken: "328b3990-b101-442f-a480-2ed09ebc7b4f",
    leaseExpiresAt: new Date(),
    availableAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    lastError: null,
  };
  const operations: DocumentOperation[] = [
    { indexUid: "public_products", entityId: job.entityId, document: null },
    {
      indexUid: "admin_products",
      entityId: job.entityId,
      document: { id: job.entityId },
    },
  ];
  const events: string[] = [];
  const submitted: SearchOutboxTask[] = [];
  const processor: JobProcessor = {
    async heartbeat() {},
    async readOperations() {
      events.push("read");
      return operations;
    },
    async submit(operation) {
      const task: SearchOutboxTask = {
        indexUid: operation.indexUid,
        operation: operation.document ? "replace" : "delete",
        taskUid: submitted.length + 10,
      };
      submitted.push(task);
      events.push(`submit:${task.indexUid}`);
      return task;
    },
    async saveTasks(tasks, version) {
      job.tasks = tasks;
      job.taskVersion = version;
      events.push(`save:${tasks.length}`);
    },
    async settle(tasks) {
      events.push(`settle:${tasks.length}`);
      return true;
    },
    async acknowledge() {
      events.push("acknowledge");
    },
  };
  return { job, processor, events, submitted };
}

test("submitted tasks are saved before further submissions and acknowledged after success", async () => {
  const { job, processor, events } = fixture();
  assert.deepEqual(await processClaimedJob(job, processor), {
    documentsChecked: 2,
    documentsUpserted: 1,
    documentsDeleted: 1,
  });
  assert.deepEqual(events, [
    "settle:0",
    "read",
    "submit:public_products",
    "save:1",
    "submit:admin_products",
    "save:2",
    "settle:2",
    "acknowledge",
  ]);
});

test("partial saved submissions resume only the missing index", async () => {
  const { job, processor, submitted } = fixture();
  job.tasks = [
    { indexUid: "public_products", taskUid: 3, operation: "delete" },
  ];
  await processClaimedJob(job, processor);
  assert.deepEqual(
    submitted.map((task) => task.indexUid),
    ["admin_products"],
  );
});

test("older tasks settle before the newer version is read and submitted", async () => {
  const { job, processor, events, submitted } = fixture(2, 1);
  job.tasks = [
    { indexUid: "public_products", taskUid: 3, operation: "replace" },
  ];
  await processClaimedJob(job, processor);
  assert.deepEqual(events.slice(0, 3), ["settle:1", "save:0", "read"]);
  assert.equal(job.taskVersion, 2);
  assert.equal(submitted.length, 2);
});

test("unknown task outcomes retain references and prevent acknowledgement", async () => {
  const { job, processor, events } = fixture();
  const pending: SearchOutboxTask = {
    indexUid: "public_products",
    taskUid: 3,
    operation: "replace",
  };
  job.tasks = [pending];
  processor.settle = async () => {
    throw new Error("timeout");
  };
  await assert.rejects(processClaimedJob(job, processor), /timeout/u);
  assert.deepEqual(job.tasks, [pending]);
  assert.equal(events.includes("acknowledge"), false);
  assert.equal(events.includes("read"), false);
});

test("terminal failure clears settled references without acknowledging", async () => {
  const { job, processor, events } = fixture();
  job.tasks = [
    { indexUid: "public_products", taskUid: 3, operation: "replace" },
  ];
  processor.settle = async () => false;
  await assert.rejects(processClaimedJob(job, processor), /retry scheduled/u);
  assert.deepEqual(job.tasks, []);
  assert.equal(events.includes("acknowledge"), false);
});

test("later submission failure preserves the first accepted task", async () => {
  const { job, processor, events } = fixture();
  const submit = processor.submit;
  processor.submit = async (operation) => {
    if (operation.indexUid === "admin_products") throw new Error("unavailable");
    return submit(operation);
  };
  await assert.rejects(processClaimedJob(job, processor), /unavailable/u);
  assert.equal(job.tasks.length, 1);
  assert.equal(job.tasks[0]?.indexUid, "public_products");
  assert.equal(events.includes("acknowledge"), false);
});

test("retry delay starts at thirty seconds and caps at fifteen minutes", () => {
  assert.equal(retryDelaySeconds(1), 30);
  assert.equal(retryDelaySeconds(2), 60);
  assert.equal(retryDelaySeconds(100), 900);
});

test("lease loss prevents new submissions and preserves saved recovery references", async () => {
  const { job, processor, submitted, events } = fixture();
  job.tasks = [
    { indexUid: "public_products", taskUid: 3, operation: "replace" },
  ];
  processor.heartbeat = async () => {
    throw new LeaseLostError();
  };
  await assert.rejects(processClaimedJob(job, processor), LeaseLostError);
  assert.equal(submitted.length, 0);
  assert.equal(job.tasks[0]?.taskUid, 3);
  assert.equal(events.includes("acknowledge"), false);
});
