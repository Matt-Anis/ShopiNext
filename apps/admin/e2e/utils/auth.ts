import type { Page } from "@playwright/test"
import { DEFAULT_TEST_ADMIN } from "./seed-user"

export async function signIn(page: Page) {
  await page.goto("/login")
  await page.getByTestId("login-email-input").fill(DEFAULT_TEST_ADMIN.email)
  await page
    .getByTestId("login-password-input")
    .fill(DEFAULT_TEST_ADMIN.password)
  await page.getByTestId("login-submit-button").click()
  await page.waitForURL("/")
}
