import { randomUUID } from "node:crypto"
import type { APIRequestContext } from "@playwright/test"
import { eq } from "drizzle-orm"
import { hashPassword } from "better-auth/crypto"
import { adminUser, adminAccount } from "@repo/db/admin/auth-schema"
import { testDb } from "./db"
import { uniqueSuffix } from "./unique"

export const DEFAULT_TEST_ADMIN = {
  name: "Test Admin",
  email: "test.admin@example.com",
  password: "password123",
}

const DEFAULT_TEST_ADMIN_PASSWORD_HASH =
  "990a68a7bb59286ea5ff7fef3bba58f5:fcc02e81336324522fa485074d41fcc6198e9381b91be18b80d654967d6ca5dcc0528145519ac6e07799435b35eb76a116b06bfba1ef3d32c14e7fd13361fa49"

export async function seedAdmin(
  overrides: Partial<typeof DEFAULT_TEST_ADMIN> = {}
) {
  const credentials = { ...DEFAULT_TEST_ADMIN, ...overrides }
  const [localPart, domain] = credentials.email.split("@")
  credentials.email = `${localPart}+${uniqueSuffix()}@${domain}`
  const userId = randomUUID()

  await testDb.insert(adminUser).values({
    id: userId,
    name: credentials.name,
    email: credentials.email,
    role: "admin",
  })

  await testDb.insert(adminAccount).values({
    id: randomUUID(),
    userId,
    accountId: userId,
    providerId: "credential",
    password:
      credentials.password === DEFAULT_TEST_ADMIN.password
        ? DEFAULT_TEST_ADMIN_PASSWORD_HASH
        : await hashPassword(credentials.password),
  })

  return { ...credentials, id: userId }
}

export const DEFAULT_NEW_STAFF = {
  name: "New Staff",
  email: "new.staff@example.com",
}

const ORIGIN = "http://localhost:3001"

export async function createStaffAccountViaApi(
  request: APIRequestContext,
  adminCredentials: Pick<typeof DEFAULT_TEST_ADMIN, "email" | "password">,
  overrides: Partial<typeof DEFAULT_NEW_STAFF> = {}
) {
  const staff = { ...DEFAULT_NEW_STAFF, ...overrides }
  const [localPart, domain] = staff.email.split("@")
  staff.email = `${localPart}+${uniqueSuffix()}@${domain}`

  const signInResponse = await request.post("/api/auth/sign-in/email", {
    headers: { origin: ORIGIN },
    data: {
      email: adminCredentials.email,
      password: adminCredentials.password,
    },
  })
  if (!signInResponse.ok()) {
    throw new Error(
      `Admin sign-in failed (${signInResponse.status()}): ${await signInResponse.text()}`
    )
  }

  const createUserResponse = await request.post("/api/auth/admin/create-user", {
    headers: { origin: ORIGIN },
    data: { name: staff.name, email: staff.email, role: "user" },
  })
  if (!createUserResponse.ok()) {
    throw new Error(
      `create-user failed (${createUserResponse.status()}): ${await createUserResponse.text()}`
    )
  }

  const resetRequestResponse = await request.post(
    "/api/auth/request-password-reset",
    {
      headers: { origin: ORIGIN },
      data: { email: staff.email, redirectTo: "/reset-password" },
    }
  )
  if (!resetRequestResponse.ok()) {
    throw new Error(
      `request-password-reset failed (${resetRequestResponse.status()}): ${await resetRequestResponse.text()}`
    )
  }

  const [createdUser] = await testDb
    .select()
    .from(adminUser)
    .where(eq(adminUser.email, staff.email))
  if (!createdUser) {
    throw new Error(`Staff user ${staff.email} was not found after creation`)
  }

  return { ...staff, id: createdUser.id }
}
