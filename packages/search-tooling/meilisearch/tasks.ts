import type { EnqueuedTaskPromise } from "meilisearch";

export async function requireSuccessfulTask(
  task: EnqueuedTaskPromise,
  operation: string,
) {
  const completed = await task.waitTask({ timeout: 60_000, interval: 250 });
  if (completed.status !== "succeeded") {
    throw new Error(
      `${operation} ${completed.status}: ${completed.error?.message ?? "Indexing task did not succeed."}`,
    );
  }
}
