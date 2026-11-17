import type { SearchSyncKind } from "@repo/db/admin/schema";
import type { SearchReadDatabase } from "../db/client";
import { describeWorkerError, LeaseLostError } from "./errors";
import { acquireSyncLease, releaseSyncLease, renewSyncLease, type SyncLease } from "./lease";
import { createRunCounts, finishSyncRun, startSyncRun, type RunCounts } from "./runs";

export type WorkerContext = {
  lease: SyncLease;
  counts: RunCounts;
  lastError: string | null;
  heartbeat: () => Promise<void>;
};

export async function runSearchWorker(
  db: SearchReadDatabase,
  kind: SearchSyncKind,
  work: (context: WorkerContext) => Promise<void>,
): Promise<boolean> {
  const lease = await acquireSyncLease(db);
  if (!lease) {
    console.info("Search run skipped: another worker owns the lease.");
    return true;
  }
  let runId: string | undefined;
  const context: WorkerContext = {
    lease,
    counts: createRunCounts(),
    lastError: null,
    heartbeat: () => renewSyncLease(db, lease),
  };
  try {
    runId = await startSyncRun(db, lease, kind);
    await work(context);
    await context.heartbeat();
    const succeeded = context.counts.jobsFailed === 0;
    await finishSyncRun(db, lease, runId, succeeded ? "succeeded" : "failed", context.counts, context.lastError);
    console.info(`Search ${kind}: ${JSON.stringify(context.counts)}`);
    return succeeded;
  } catch (error) {
    if (runId) {
      await finishSyncRun(db, lease, runId, error instanceof LeaseLostError ? "interrupted" : "failed", context.counts, describeWorkerError(error));
    }
    throw error;
  } finally {
    await releaseSyncLease(db, lease);
  }
}
