import { and, eq, gt } from "drizzle-orm";
import { searchOutbox, type SearchOutboxTask } from "@repo/db/admin/schema";
import type { SearchReadDatabase } from "../db/client";
import { databaseNow } from "../worker/clock";
import { LeaseLostError } from "../worker/errors";
import type { ClaimedJob } from "./jobs";

export function ownedJob(job: ClaimedJob) {
  return and(
    eq(searchOutbox.id, job.id),
    eq(searchOutbox.leaseToken, job.leaseToken),
    gt(searchOutbox.leaseExpiresAt, databaseNow),
  );
}

export async function saveJobTasks(
  db: SearchReadDatabase,
  job: ClaimedJob,
  tasks: SearchOutboxTask[],
  taskVersion = job.taskVersion,
): Promise<void> {
  const [saved] = await db
    .update(searchOutbox)
    .set({ tasks, taskVersion })
    .where(and(ownedJob(job), eq(searchOutbox.taskVersion, job.taskVersion)))
    .returning({ id: searchOutbox.id });
  if (!saved) throw new LeaseLostError();
  job.tasks = tasks;
  job.taskVersion = taskVersion;
}

export async function acknowledgeJob(
  db: SearchReadDatabase,
  job: ClaimedJob,
): Promise<void> {
  const [deleted] = await db
    .delete(searchOutbox)
    .where(
      and(
        ownedJob(job),
        eq(searchOutbox.version, job.taskVersion),
        eq(searchOutbox.taskVersion, job.taskVersion),
      ),
    )
    .returning({ id: searchOutbox.id });
  if (deleted) return;

  const [released] = await db
    .update(searchOutbox)
    .set({ tasks: [], taskVersion: null, leaseToken: null, leaseExpiresAt: null })
    .where(
      and(
        ownedJob(job),
        gt(searchOutbox.version, job.taskVersion),
        eq(searchOutbox.taskVersion, job.taskVersion),
      ),
    )
    .returning({ id: searchOutbox.id });
  if (!released) throw new LeaseLostError();
}
