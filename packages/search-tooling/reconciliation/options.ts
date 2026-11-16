import { parseArgs } from "node:util";
import { parseSyncOptions } from "../sync/options";

export type ReconciliationOptions = { batchSize: number; maxJobs: number };

export function parseReconciliationOptions(args: string[]): ReconciliationOptions {
  const { values } = parseArgs({
    args,
    options: {
      "batch-size": { type: "string", default: "100" },
      "max-jobs": { type: "string", default: "1000" },
    },
    allowPositionals: false,
    strict: true,
  });
  const raw = values["batch-size"] ?? "100";
  const batchSize = Number(raw);
  if (!/^[1-9]\d*$/u.test(raw) || !Number.isInteger(batchSize) || batchSize > 200) {
    throw new Error("--batch-size must be an integer between 1 and 200.");
  }
  const { maxJobs } = parseSyncOptions(["--max-jobs", values["max-jobs"] ?? "1000"]);
  return { batchSize, maxJobs };
}
