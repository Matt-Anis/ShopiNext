import type { Page } from "@playwright/test"
import { and, eq } from "drizzle-orm"
import { account } from "@repo/db/public/auth-schema"
import { testDb } from "./db"
import { signIn } from "./auth"
import { getSeededUserId, seedUser } from "./seed-user"
import { uniqueNameSuffix, uniqueSuffix } from "./unique"

export async function seedGoogleUser(page: Page) {
  const customer = await seedUser(page.request, {
    name: `GP ${uniqueNameSuffix()}`,
    email: "google-password@example.com",
  })
  const userId = await getSeededUserId(customer.email)
  await signIn(page, customer)

  await testDb
    .update(account)
    .set({
      providerId: "google",
      accountId: `google-${uniqueSuffix()}`,
      password: null,
    })
    .where(
      and(eq(account.userId, userId), eq(account.providerId, "credential"))
    )

  return { userId, email: customer.email, name: customer.name }
}
