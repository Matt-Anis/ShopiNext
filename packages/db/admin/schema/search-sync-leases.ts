import { sql } from "drizzle-orm";
import { check, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { adminSchema } from "./base";

export const searchSyncLeases = adminSchema.table(
  "search_sync_leases",
  {
    name: text().primaryKey().default("search-sync"),
    ownerToken: uuid().notNull(),
    acquiredAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    renewedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
  },
  (table) => [
    check("search_sync_leases_name_check", sql`${table.name} = 'search-sync'`),
  ],
);
