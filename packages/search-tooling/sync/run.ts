import type { Meilisearch } from "meilisearch";
import type { SearchReadDatabase } from "../db/client";
import { describeWorkerError, LeaseLostError } from "../worker/errors";
import { renewJobLease } from "./jobs";
import { runSearchWorker, type WorkerContext } from "../worker/run";
import { processOutboxBatch } from "./batch";
import { readEntityOperations, submitDocumentOperation } from "./operations";
import { processClaimedJob } from "./process-job";
import { retryJob } from "./retry";
import { acknowledgeJob, saveJobTasks } from "./state";
import { settleJobTasks } from "./tasks";

export async function syncOutbox(
  db: SearchReadDatabase,
  client: Meilisearch,
  context: WorkerContext,
  maxJobs: number,
): Promise<void> {
  await processOutboxBatch(db, context.lease, maxJobs, async (job) => {
    const heartbeat = async () => {
      await context.heartbeat();
      await renewJobLease(db, job, context.lease);
    };
    try {
      const counts = await processClaimedJob(job, {
        heartbeat,
        readOperations: () => readEntityOperations(db, job.entityType, job.entityId),
        submit: (operation) => submitDocumentOperation(client, operation),
        saveTasks: (tasks, version) => saveJobTasks(db, job, tasks, version),
        settle: (tasks) => settleJobTasks(client, tasks, heartbeat),
        acknowledge: () => acknowledgeJob(db, job),
      });
      context.counts.jobsProcessed += 1;
      context.counts.documentsChecked += counts.documentsChecked;
      context.counts.documentsUpserted += counts.documentsUpserted;
      context.counts.documentsDeleted += counts.documentsDeleted;
    } catch (error) {
      if (error instanceof LeaseLostError) throw error;
      await heartbeat();
      await retryJob(db, job, error);
      context.counts.jobsFailed += 1;
      context.lastError = describeWorkerError(error);
    }
  });
}

export function runOutboxWorker(
  db: SearchReadDatabase,
  client: Meilisearch,
  maxJobs: number,
) {
  return runSearchWorker(db, "outbox", (context) => syncOutbox(db, client, context, maxJobs));
}
