import { randomUUID } from "node:crypto";
import { and, eq, gt, lte } from "drizzle-orm";
import { searchSyncLeases } from "@repo/db/admin/schema";
import type { SearchReadDatabase } from "../db/client";
import { databaseNow, leaseExpiry } from "./clock";
import { LeaseLostError } from "./errors";

export type SyncLease = { ownerToken: string; expiresAt: Date };

export async function acquireSyncLease(
  db: SearchReadDatabase,
): Promise<SyncLease | null> {
  const values = {
    name: "search-sync",
    ownerToken: randomUUID(),
    acquiredAt: databaseNow,
    renewedAt: databaseNow,
    expiresAt: leaseExpiry,
  };
  const [lease] = await db
    .insert(searchSyncLeases)
    .values(values)
    .onConflictDoUpdate({
      target: searchSyncLeases.name,
      set: values,
      setWhere: lte(searchSyncLeases.expiresAt, databaseNow),
    })
    .returning({
      ownerToken: searchSyncLeases.ownerToken,
      expiresAt: searchSyncLeases.expiresAt,
    });
  return lease ?? null;
}

export async function renewSyncLease(
  db: SearchReadDatabase,
  lease: SyncLease,
): Promise<void> {
  const [renewed] = await db
    .update(searchSyncLeases)
    .set({ renewedAt: databaseNow, expiresAt: leaseExpiry })
    .where(
      and(
        eq(searchSyncLeases.name, "search-sync"),
        eq(searchSyncLeases.ownerToken, lease.ownerToken),
        gt(searchSyncLeases.expiresAt, databaseNow),
      ),
    )
    .returning({ expiresAt: searchSyncLeases.expiresAt });
  if (!renewed) throw new LeaseLostError();
  lease.expiresAt = renewed.expiresAt;
}

export async function releaseSyncLease(
  db: SearchReadDatabase,
  lease: SyncLease,
): Promise<void> {
  await db
    .delete(searchSyncLeases)
    .where(
      and(
        eq(searchSyncLeases.name, "search-sync"),
        eq(searchSyncLeases.ownerToken, lease.ownerToken),
      ),
    );
}
