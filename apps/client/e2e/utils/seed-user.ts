import type { APIRequestContext } from "@playwright/test";

export const DEFAULT_TEST_USER = {
  name: "Test User",
  email: "test.user@example.com",
  password: "password123",
};

export async function seedUser(
  request: APIRequestContext,
  overrides: Partial<typeof DEFAULT_TEST_USER> = {},
) {
  const credentials = { ...DEFAULT_TEST_USER, ...overrides };
  const response = await request.post("/api/auth/sign-up/email", {
    data: credentials,
  });

  if (!response.ok()) {
    throw new Error(
      `Failed to seed user: ${response.status()} ${await response.text()}`,
    );
  }

  return credentials;
}
