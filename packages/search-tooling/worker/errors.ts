import { MeilisearchApiError } from "meilisearch";

export class WorkerError extends Error {}
export class LeaseLostError extends WorkerError {
  constructor() {
    super("Search worker lease was lost; work remains recoverable.");
  }
}

export function describeWorkerError(error: unknown): string {
  if (error instanceof WorkerError) return error.message;
  const code =
    error instanceof MeilisearchApiError
      ? error.cause?.code
      : error && typeof error === "object" && "code" in error
        ? error.code
        : undefined;
  return typeof code === "string" && /^[a-zA-Z0-9_]+$/u.test(code)
    ? `Search synchronization failed (${code}).`
    : "Search synchronization failed; check service connectivity and configuration.";
}
