import { test, expect } from "@playwright/test"
import { seedAdmin } from "../../utils/seed-user"

let admin: Awaited<ReturnType<typeof seedAdmin>>

test.beforeEach(async () => {
  admin = await seedAdmin()
})

test.describe("Admin sign in", () => {
  test("logs in with correct credentials and redirects to the dashboard", async ({
    page,
  }) => {
    await page.goto("/login")

    await page.getByTestId("login-email-input").fill(admin.email)
    await page.getByTestId("login-password-input").fill(admin.password)
    await page.getByTestId("login-submit-button").click()

    await expect(page.getByText("Signed in successfully")).toBeVisible()
    await page.waitForURL("/")
  })

  test("rejects an incorrect password", async ({ page }) => {
    await page.goto("/login")

    await page.getByTestId("login-email-input").fill(admin.email)
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
    await page.getByTestId("login-email-input").fill(admin.email)
    await page.getByTestId("login-password-input").fill(admin.password)
    await page.getByTestId("login-submit-button").click()
    await page.waitForURL("/")

    await page.goto("/login")

    await page.waitForURL("/")
  })
})
