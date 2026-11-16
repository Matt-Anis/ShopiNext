import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  jsonb,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { adminSchema } from "./base";

export type SearchEntityType =
  "product" | "category" | "order" | "customer" | "staff";

export type SearchOutboxTask = {
  indexUid: string;
  taskUid: number;
  operation: "replace" | "delete";
};

export const searchOutbox = adminSchema.table(
  "search_outbox",
  {
    id: uuid().primaryKey().defaultRandom(),
    entityType: text().$type<SearchEntityType>().notNull(),
    entityId: text().notNull(),
    version: integer().notNull().default(1),
    attempts: integer().notNull().default(0),
    availableAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    leaseToken: uuid(),
    leaseExpiresAt: timestamp({ withTimezone: true }),
    taskVersion: integer(),
    tasks: jsonb().$type<SearchOutboxTask[]>().notNull().default([]),
    lastError: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("search_outbox_entity_unique").on(
      table.entityType,
      table.entityId,
    ),
    index("search_outbox_available_idx").on(
      table.availableAt,
      table.createdAt,
      table.id,
    ),
    index("search_outbox_lease_idx")
      .on(table.leaseExpiresAt)
      .where(sql`${table.leaseToken} is not null`),
    check(
      "search_outbox_entity_type_check",
      sql`${table.entityType} in ('product', 'category', 'order', 'customer', 'staff')`,
    ),
    check(
      "search_outbox_entity_id_check",
      sql`length(btrim(${table.entityId})) > 0`,
    ),
    check("search_outbox_version_check", sql`${table.version} >= 1`),
    check("search_outbox_attempts_check", sql`${table.attempts} >= 0`),
    check(
      "search_outbox_lease_check",
      sql`(${table.leaseToken} is null) = (${table.leaseExpiresAt} is null)`,
    ),
    check(
      "search_outbox_tasks_check",
      sql`jsonb_typeof(${table.tasks}) = 'array'`,
    ),
    check(
      "search_outbox_task_version_check",
      sql`
    (${table.taskVersion} is null and ${table.tasks} = '[]'::jsonb)
    or (${table.taskVersion} is not null and ${table.taskVersion} >= 1 and ${table.taskVersion} <= ${table.version})
  `,
    ),
  ],
);
