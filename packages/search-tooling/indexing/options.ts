import { parseArgs } from "node:util";

export type IndexingOptions = { rebuild: boolean; batchSize: number };

export function parseIndexingOptions(args: string[]): IndexingOptions {
  const { values } = parseArgs({
    args,
    options: {
      rebuild: { type: "boolean", default: false },
      "batch-size": { type: "string", default: "100" },
    },
    allowPositionals: false,
    strict: true,
  });
  const rawBatchSize = values["batch-size"] ?? "100";
  const batchSize = Number(rawBatchSize);
  if (
    !/^[1-9]\d*$/u.test(rawBatchSize) ||
    !Number.isInteger(batchSize) ||
    batchSize > 1_000
  ) {
    throw new Error("--batch-size must be an integer between 1 and 1000.");
  }

  return { rebuild: values.rebuild ?? false, batchSize };
}
