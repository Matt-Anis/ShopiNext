import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { adminSchema } from "./base";

export type SearchSyncKind = "outbox" | "reconcile";
export type SearchSyncRunStatus =
  "running" | "succeeded" | "failed" | "interrupted";

export const searchSyncRuns = adminSchema.table(
  "search_sync_runs",
  {
    id: uuid().primaryKey().defaultRandom(),
    kind: text().$type<SearchSyncKind>().notNull(),
    status: text().$type<SearchSyncRunStatus>().notNull().default("running"),
    leaseToken: uuid().notNull(),
    startedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    finishedAt: timestamp({ withTimezone: true }),
    jobsProcessed: integer().notNull().default(0),
    jobsFailed: integer().notNull().default(0),
    documentsChecked: integer().notNull().default(0),
    documentsUpserted: integer().notNull().default(0),
    documentsDeleted: integer().notNull().default(0),
    lastError: text(),
  },
  (table) => [
    index("search_sync_runs_started_idx").on(table.startedAt, table.id),
    index("search_sync_runs_running_idx")
      .on(table.startedAt)
      .where(sql`${table.status} = 'running'`),
    check(
      "search_sync_runs_kind_check",
      sql`${table.kind} in ('outbox', 'reconcile')`,
    ),
    check(
      "search_sync_runs_status_check",
      sql`${table.status} in ('running', 'succeeded', 'failed', 'interrupted')`,
    ),
    check(
      "search_sync_runs_completion_check",
      sql`
    (${table.status} = 'running' and ${table.finishedAt} is null)
    or (${table.status} <> 'running' and ${table.finishedAt} is not null)
  `,
    ),
    check(
      "search_sync_runs_counts_check",
      sql`
    ${table.jobsProcessed} >= 0 and ${table.jobsFailed} >= 0
    and ${table.documentsChecked} >= 0 and ${table.documentsUpserted} >= 0
    and ${table.documentsDeleted} >= 0
  `,
    ),
  ],
);
