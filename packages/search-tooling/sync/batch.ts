import type { SearchReadDatabase } from "../db/client";
import { renewSyncLease, type SyncLease } from "../worker/lease";
import { claimNextJob, type ClaimedJob } from "./jobs";

export async function processOutboxBatch(
  db: SearchReadDatabase,
  lease: SyncLease,
  maxJobs: number,
  processJob: (job: ClaimedJob) => Promise<void>,
): Promise<number> {
  let claimed = 0;
  while (claimed < maxJobs) {
    await renewSyncLease(db, lease);
    const job = await claimNextJob(db, lease);
    if (!job) break;
    claimed += 1;
    await processJob(job);
  }
  return claimed;
}
