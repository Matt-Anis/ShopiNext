import { MeilisearchApiError, type Meilisearch } from "meilisearch";
import type { SearchOutboxTask } from "@repo/db/admin/schema";

export async function settleJobTasks(
  client: Meilisearch,
  tasks: SearchOutboxTask[],
  heartbeat: () => Promise<void>,
): Promise<boolean> {
  let succeeded = true;
  for (const task of tasks) {
    await heartbeat();
    try {
      const result = await client.tasks.waitForTask(task.taskUid, {
        timeout: 30_000,
        interval: 250,
      });
      if (result.status !== "succeeded") succeeded = false;
    } catch (error) {
      if (
        error instanceof MeilisearchApiError &&
        error.cause?.code === "task_not_found"
      ) {
        succeeded = false;
      } else {
        throw error;
      }
    }
  }
  return succeeded;
}
