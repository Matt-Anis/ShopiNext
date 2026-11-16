import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as publicSchema from "@repo/db/public/schema";
import * as publicAuthSchema from "@repo/db/public/auth-schema";
import * as adminSchema from "@repo/db/admin/schema";
import * as adminAuthSchema from "@repo/db/admin/auth-schema";

export function createSearchReadDatabase(connectionString: string) {
  const pool = new Pool({
    connectionString,
    max: 1,
    connectionTimeoutMillis: 5_000,
    options: "-c default_transaction_read_only=on",
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

export type SearchReadDatabase = ReturnType<
  typeof createSearchReadDatabase
>["db"];
