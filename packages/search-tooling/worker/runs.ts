import { and, eq, ne } from "drizzle-orm";
import { searchSyncRuns, type SearchSyncKind, type SearchSyncRunStatus } from "@repo/db/admin/schema";
import type { SearchReadDatabase } from "../db/client";
import { databaseNow } from "./clock";
import { WorkerError } from "./errors";
import type { SyncLease } from "./lease";

export function createRunCounts() {
  return {
    jobsProcessed: 0,
    jobsFailed: 0,
    documentsChecked: 0,
    documentsUpserted: 0,
    documentsDeleted: 0,
  };
}

export type RunCounts = ReturnType<typeof createRunCounts>;

export async function startSyncRun(
  db: SearchReadDatabase,
  lease: SyncLease,
  kind: SearchSyncKind,
): Promise<string> {
  await db.update(searchSyncRuns).set({
    status: "interrupted",
    finishedAt: databaseNow,
    lastError: "Worker stopped before recording completion; its lease expired.",
  }).where(and(
    eq(searchSyncRuns.status, "running"),
    ne(searchSyncRuns.leaseToken, lease.ownerToken),
  ));
  const [run] = await db.insert(searchSyncRuns).values({
    kind,
    leaseToken: lease.ownerToken,
    startedAt: databaseNow,
  }).returning({ id: searchSyncRuns.id });
  if (!run) throw new WorkerError("Search run could not be recorded.");
  return run.id;
}

export async function finishSyncRun(
  db: SearchReadDatabase,
  lease: SyncLease,
  runId: string,
  status: Exclude<SearchSyncRunStatus, "running">,
  counts: RunCounts,
  lastError: string | null,
): Promise<void> {
  await db.update(searchSyncRuns).set({
    ...counts, status, lastError, finishedAt: databaseNow,
  }).where(and(
    eq(searchSyncRuns.id, runId),
    eq(searchSyncRuns.leaseToken, lease.ownerToken),
    eq(searchSyncRuns.status, "running"),
  ));
}
