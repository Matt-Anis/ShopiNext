import { test, expect } from "@playwright/test"
import { seedUser, type DEFAULT_TEST_USER } from "../../utils/seed-user"

let credentials: typeof DEFAULT_TEST_USER

test.beforeEach(async ({ request }) => {
  credentials = await seedUser(request)
})

test.describe("Sign in", () => {
  test("logs in with correct credentials and redirects home", async ({
    page,
  }) => {
    await page.goto("/login")

    await page.getByTestId("login-email-input").fill(credentials.email)
    await page
      .getByTestId("login-password-input")
      .fill(credentials.password)
    await page.getByTestId("login-submit-button").click()

    await expect(page.getByText("Signed in successfully")).toBeVisible()
    await page.waitForURL("/")
  })

  test("rejects an incorrect password", async ({ page }) => {
    await page.goto("/login")

    await page.getByTestId("login-email-input").fill(credentials.email)
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

  test("redirects an already signed-in user away from /login", async ({
    page,
  }) => {
    await page.goto("/login")
    await page.getByTestId("login-email-input").fill(credentials.email)
    await page
      .getByTestId("login-password-input")
      .fill(credentials.password)
    await page.getByTestId("login-submit-button").click()
    await page.waitForURL("/")

    await page.goto("/login")

    await page.waitForURL("/")
  })
})
