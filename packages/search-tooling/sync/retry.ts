import { and, eq, sql } from "drizzle-orm";
import { searchOutbox } from "@repo/db/admin/schema";
import type { SearchReadDatabase } from "../db/client";
import { databaseNow } from "../worker/clock";
import { describeWorkerError, LeaseLostError } from "../worker/errors";
import type { ClaimedJob } from "./jobs";
import { ownedJob } from "./state";

export function retryDelaySeconds(attempts: number): number {
  return Math.min(900, 30 * 2 ** Math.min(5, Math.max(0, attempts - 1)));
}

export async function retryJob(
  db: SearchReadDatabase,
  job: ClaimedJob,
  error: unknown,
): Promise<void> {
  const delay = retryDelaySeconds(job.attempts);
  const [retried] = await db
    .update(searchOutbox)
    .set({
      leaseToken: null,
      leaseExpiresAt: null,
      lastError: describeWorkerError(error),
      availableAt: sql<Date>`${databaseNow} + ${delay} * interval '1 second'`,
    })
    .where(and(ownedJob(job), eq(searchOutbox.version, job.version)))
    .returning({ id: searchOutbox.id });
  if (retried) return;

  const [released] = await db
    .update(searchOutbox)
    .set({ leaseToken: null, leaseExpiresAt: null })
    .where(ownedJob(job))
    .returning({ id: searchOutbox.id });
  if (!released) throw new LeaseLostError();
}
