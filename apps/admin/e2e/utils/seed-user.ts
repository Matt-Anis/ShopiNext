import { randomUUID } from "node:crypto"
import { hashPassword } from "better-auth/crypto"
import { adminUser, adminAccount } from "@repo/db/admin/auth-schema"
import { testDb } from "./db"

export const DEFAULT_TEST_ADMIN = {
  name: "Test Admin",
  email: "test.admin@example.com",
  password: "password123",
}

// Inserted directly rather than through /api/auth/sign-up/email — that
// endpoint is disabled in the admin app (emailAndPassword.disableSignUp).
export async function seedAdmin(
  overrides: Partial<typeof DEFAULT_TEST_ADMIN> = {}
) {
  const credentials = { ...DEFAULT_TEST_ADMIN, ...overrides }
  const userId = randomUUID()

  await testDb.insert(adminUser).values({
    id: userId,
    name: credentials.name,
    email: credentials.email,
  })

  await testDb.insert(adminAccount).values({
    id: randomUUID(),
    userId,
    accountId: userId,
    providerId: "credential",
    password: await hashPassword(credentials.password),
  })

  return credentials
}
