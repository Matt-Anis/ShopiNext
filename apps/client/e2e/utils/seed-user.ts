import type { APIRequestContext } from "@playwright/test"
import { eq } from "drizzle-orm"
import { user } from "@repo/db/public/auth-schema"
import { testDb } from "./db"

export const DEFAULT_TEST_USER = {
  name: "Test User",
  email: "test.user@example.com",
  password: "password123",
}

export async function seedUser(
  request: APIRequestContext,
  overrides: Partial<typeof DEFAULT_TEST_USER> = {},
  options: { verified?: boolean } = {}
) {
  const { verified = true } = options
  const credentials = { ...DEFAULT_TEST_USER, ...overrides }
  const response = await request.post("/api/auth/sign-up/email", {
    data: credentials,
  })

  if (!response.ok()) {
    throw new Error(
      `Failed to seed user: ${response.status()} ${await response.text()}`
    )
  }

  if (verified) {
    await testDb
      .update(user)
      .set({ emailVerified: true })
      .where(eq(user.email, credentials.email))
  }

  return credentials
}
