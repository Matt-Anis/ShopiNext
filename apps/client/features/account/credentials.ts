import "server-only"

import { and, eq, isNotNull, ne } from "drizzle-orm"
import { account } from "@repo/db/public/auth-schema"
import { db } from "@/db"

export async function hasCustomerPassword(userId: string) {
  const [credential] = await db
    .select({ id: account.id })
    .from(account)
    .where(
      and(
        eq(account.userId, userId),
        eq(account.providerId, "credential"),
        isNotNull(account.password),
        ne(account.password, "")
      )
    )
    .limit(1)

  return !!credential
}
