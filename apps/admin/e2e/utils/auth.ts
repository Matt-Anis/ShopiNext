import type { Page } from "@playwright/test"
import { DEFAULT_TEST_ADMIN } from "./seed-user"

export async function signIn(page: Page) {
  await page.request.post("/api/auth/sign-in/email", {
    data: {
      email: DEFAULT_TEST_ADMIN.email,
      password: DEFAULT_TEST_ADMIN.password,
    },
  })
  await page.goto("/")
}
