import { sql } from "drizzle-orm";
import { searchOutbox, type SearchEntityType } from "@repo/db/admin/schema";
import type { SearchReadDatabase } from "../db/client";
import { databaseNow } from "../worker/clock";

export async function enqueueRepairs(
  db: SearchReadDatabase,
  entityType: SearchEntityType,
  ids: string[],
): Promise<void> {
  if (ids.length === 0) return;
  await db.insert(searchOutbox).values([...new Set(ids)].map((entityId) => ({
    entityType, entityId, availableAt: databaseNow, updatedAt: databaseNow,
  }))).onConflictDoUpdate({
    target: [searchOutbox.entityType, searchOutbox.entityId],
    set: {
      version: sql`${searchOutbox.version} + 1`,
      attempts: 0,
      lastError: null,
      availableAt: databaseNow,
      updatedAt: databaseNow,
    },
  });
}
