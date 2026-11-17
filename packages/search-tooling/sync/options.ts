import { parseArgs } from "node:util";

export function parseSyncOptions(args: string[]) {
  const { values } = parseArgs({
    args,
    options: { "max-jobs": { type: "string", default: "100" } },
    strict: true,
    allowPositionals: false,
  });
  const raw = values["max-jobs"] ?? "100";
  const maxJobs = Number(raw);
  if (!/^[1-9]\d*$/u.test(raw) || !Number.isInteger(maxJobs) || maxJobs > 10_000) {
    throw new Error("--max-jobs must be an integer between 1 and 10000.");
  }
  return { maxJobs };
}
