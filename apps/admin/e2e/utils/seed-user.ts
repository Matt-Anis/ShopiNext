import type { APIRequestContext } from "@playwright/test"

export const DEFAULT_TEST_ADMIN = {
  name: "Test Admin",
  email: "test.admin@example.com",
  password: "password123",
}

export async function seedAdmin(
  request: APIRequestContext,
  overrides: Partial<typeof DEFAULT_TEST_ADMIN> = {}
) {
  const credentials = { ...DEFAULT_TEST_ADMIN, ...overrides }
  const response = await request.post("/api/auth/sign-up/email", {
    data: credentials,
  })

  if (!response.ok()) {
    throw new Error(
      `Failed to seed admin: ${response.status()} ${await response.text()}`
    )
  }

  return credentials
}
