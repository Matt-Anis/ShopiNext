import type { SearchOutboxTask } from "@repo/db/admin/schema";
import { WorkerError } from "../worker/errors";
import type { ClaimedJob } from "./jobs";
import type { DocumentOperation } from "./operations";

export type JobProcessor = {
  heartbeat: () => Promise<void>;
  readOperations: () => Promise<DocumentOperation[]>;
  submit: (operation: DocumentOperation) => Promise<SearchOutboxTask>;
  saveTasks: (tasks: SearchOutboxTask[], version: number) => Promise<void>;
  settle: (tasks: SearchOutboxTask[]) => Promise<boolean>;
  acknowledge: () => Promise<void>;
};

async function requireSettledTasks(
  job: ClaimedJob,
  processor: JobProcessor,
) {
  if (await processor.settle(job.tasks)) return;
  await processor.heartbeat();
  await processor.saveTasks([], job.version);
  throw new WorkerError("Search indexing task failed or is no longer available; retry scheduled.");
}

export async function processClaimedJob(
  job: ClaimedJob,
  processor: JobProcessor,
) {
  await processor.heartbeat();
  await requireSettledTasks(job, processor);
  if (job.taskVersion !== job.version) {
    await processor.saveTasks([], job.version);
  }

  const operations = await processor.readOperations();
  for (const operation of operations) {
    if (job.tasks.some((task) => task.indexUid === operation.indexUid)) continue;
    await processor.heartbeat();
    const task = await processor.submit(operation);
    await processor.saveTasks([...job.tasks, task], job.taskVersion);
  }

  await requireSettledTasks(job, processor);
  await processor.heartbeat();
  const documentsUpserted = job.tasks.filter((task) => task.operation === "replace").length;
  const documentsDeleted = job.tasks.filter((task) => task.operation === "delete").length;
  await processor.acknowledge();
  return { documentsChecked: operations.length, documentsUpserted, documentsDeleted };
}
