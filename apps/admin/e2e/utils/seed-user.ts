import { randomUUID } from "node:crypto"
import type { APIRequestContext } from "@playwright/test"
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

  // role must be "admin" — the admin plugin's permission check falls back
  // unset roles to "user", which has no permissions (e.g. can't call
  // /admin/create-user), so an unset role here would silently break any
  // test that exercises a real admin-only endpoint.
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
    password: await hashPassword(credentials.password),
  })

  return credentials
}

export const DEFAULT_NEW_STAFF = {
  name: "New Staff",
  email: "new.staff@example.com",
}

// Matches playwright.config.ts's `use.baseURL`. Better Auth's CSRF check
// (the `originCheck` middleware on state-changing routes like
// /admin/create-user and /request-password-reset) rejects requests with no
// Origin header, and Playwright's `request` fixture doesn't send one by
// default the way a browser does — so it has to be set explicitly here.
const ORIGIN = "http://localhost:3001"

// Goes through the real HTTP endpoints (sign in as admin, then the admin
// plugin's create-user + the public request-password-reset endpoint)
// rather than importing the "use server" action directly — that action
// pulls in next/headers, which only resolves inside the Next.js runtime,
// not the plain Node process Playwright test files run in. This also
// exercises the same auth/permission path a real admin hits.
export async function createStaffAccountViaApi(
  request: APIRequestContext,
  overrides: Partial<typeof DEFAULT_NEW_STAFF> = {}
) {
  const staff = { ...DEFAULT_NEW_STAFF, ...overrides }

  const signInResponse = await request.post("/api/auth/sign-in/email", {
    headers: { origin: ORIGIN },
    data: {
      email: DEFAULT_TEST_ADMIN.email,
      password: DEFAULT_TEST_ADMIN.password,
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

  return staff
}
