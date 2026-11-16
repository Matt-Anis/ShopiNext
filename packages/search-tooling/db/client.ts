import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as publicSchema from "@repo/db/public/schema";
import * as publicAuthSchema from "@repo/db/public/auth-schema";
import * as adminSchema from "@repo/db/admin/schema";
import * as adminAuthSchema from "@repo/db/admin/auth-schema";

function createSearchDatabase(connectionString: string, readOnly: boolean) {
  const pool = new Pool({
    connectionString,
    max: readOnly ? 1 : 2,
    connectionTimeoutMillis: 5_000,
    options: readOnly
      ? "-c default_transaction_read_only=on"
      : "-c statement_timeout=10000 -c lock_timeout=5000",
  });
  const db = drizzle(pool, {
    schema: {
      ...publicSchema,
      ...publicAuthSchema,
      ...adminSchema,
      ...adminAuthSchema,
    },
  });

  return { db, close: () => pool.end() };
}

export function createSearchReadDatabase(connectionString: string) {
  return createSearchDatabase(connectionString, true);
}

export function createSearchWorkerDatabase(connectionString: string) {
  return createSearchDatabase(connectionString, false);
}

export type SearchReadDatabase = ReturnType<
  typeof createSearchReadDatabase
>["db"];
