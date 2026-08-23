import { test, expect } from "@playwright/test"
import { resetAuthTables } from "../../utils/db-reset"
import { seedAdmin, DEFAULT_TEST_ADMIN } from "../../utils/seed-user"

test.beforeEach(async () => {
  await resetAuthTables()
  await seedAdmin()
})

test.describe("Admin sign in", () => {
  test("logs in with correct credentials and redirects to the dashboard", async ({
    page,
  }) => {
    await page.goto("/login")

    await page.getByTestId("login-email-input").fill(DEFAULT_TEST_ADMIN.email)
    await page
      .getByTestId("login-password-input")
      .fill(DEFAULT_TEST_ADMIN.password)
    await page.getByTestId("login-submit-button").click()

    await expect(page.getByText("Signed in successfully")).toBeVisible()
    await page.waitForURL("/")
  })

  test("rejects an incorrect password", async ({ page }) => {
    await page.goto("/login")

    await page.getByTestId("login-email-input").fill(DEFAULT_TEST_ADMIN.email)
    await page.getByTestId("login-password-input").fill("wrong-password")
    await page.getByTestId("login-submit-button").click()

    await expect(page.getByText("Login failed")).toBeVisible()
    await expect(page).toHaveURL(/\/login/)
  })

  test("rejects a non-existent email", async ({ page }) => {
    await page.goto("/login")

    await page.getByTestId("login-email-input").fill("nobody@example.com")
    await page.getByTestId("login-password-input").fill("password123")
    await page.getByTestId("login-submit-button").click()

    await expect(page.getByText("Login failed")).toBeVisible()
    await expect(page).toHaveURL(/\/login/)
  })

  test("redirects an already signed-in admin away from /login", async ({
    page,
  }) => {
    await page.goto("/login")
    await page.getByTestId("login-email-input").fill(DEFAULT_TEST_ADMIN.email)
    await page
      .getByTestId("login-password-input")
      .fill(DEFAULT_TEST_ADMIN.password)
    await page.getByTestId("login-submit-button").click()
    await page.waitForURL("/")

    await page.goto("/login")

    await page.waitForURL("/")
  })
})
