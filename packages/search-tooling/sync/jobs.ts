import { randomUUID } from "node:crypto";
import { and, asc, eq, gt, isNull, lte, or } from "drizzle-orm";
import { searchOutbox } from "@repo/db/admin/schema";
import type { SearchReadDatabase } from "../db/client";
import { databaseNow } from "../worker/clock";
import { LeaseLostError, WorkerError } from "../worker/errors";
import type { SyncLease } from "../worker/lease";

export type ClaimedJob = typeof searchOutbox.$inferSelect & {
  leaseToken: string;
  leaseExpiresAt: Date;
  taskVersion: number;
};

export async function claimNextJob(
  db: SearchReadDatabase,
  lease: SyncLease,
): Promise<ClaimedJob | null> {
  return db.transaction(async (tx) => {
    const [job] = await tx
      .select()
      .from(searchOutbox)
      .where(
        and(
          lte(searchOutbox.availableAt, databaseNow),
          or(
            isNull(searchOutbox.leaseExpiresAt),
            lte(searchOutbox.leaseExpiresAt, databaseNow),
          ),
        ),
      )
      .orderBy(
        asc(searchOutbox.availableAt),
        asc(searchOutbox.createdAt),
        asc(searchOutbox.id),
      )
      .limit(1)
      .for("update", { skipLocked: true });
    if (!job) return null;

    const leaseToken = randomUUID();
    const taskVersion = job.taskVersion ?? job.version;
    const [claimed] = await tx
      .update(searchOutbox)
      .set({
        leaseToken,
        leaseExpiresAt: lease.expiresAt,
        taskVersion,
        attempts: job.attempts + 1,
      })
      .where(eq(searchOutbox.id, job.id))
      .returning();
    if (!claimed) throw new WorkerError("Claimed search job disappeared.");
    return {
      ...claimed,
      leaseToken,
      leaseExpiresAt: lease.expiresAt,
      taskVersion,
    };
  });
}

export async function renewJobLease(
  db: SearchReadDatabase,
  job: ClaimedJob,
  lease: SyncLease,
): Promise<void> {
  const [owned] = await db
    .update(searchOutbox)
    .set({ leaseExpiresAt: lease.expiresAt })
    .where(
      and(
        eq(searchOutbox.id, job.id),
        eq(searchOutbox.leaseToken, job.leaseToken),
        gt(searchOutbox.leaseExpiresAt, databaseNow),
      ),
    )
    .returning({ id: searchOutbox.id });
  if (!owned) throw new LeaseLostError();
}
