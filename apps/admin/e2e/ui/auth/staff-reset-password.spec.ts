import { test, expect } from "@playwright/test"
import { getResetPasswordToken } from "../../utils/db"
import { resetAuthTables } from "../../utils/db-reset"
import { seedAdmin, createStaffAccountViaApi } from "../../utils/seed-user"

test.beforeEach(async () => {
  await resetAuthTables()
})

test.describe("Staff reset password", () => {
  test("404s when no token is given", async ({ page }) => {
    const response = await page.goto("/reset-password")
    expect(response?.status()).toBe(404)
  })

  test("rejects mismatched passwords", async ({ page }) => {
    await page.goto("/reset-password?token=not-a-real-token")

    await page.getByTestId("reset-password-password-input").fill("Passw0rd")
    await page
      .getByTestId("reset-password-confirm-password-input")
      .fill("Passw0rd1")
    await page.getByTestId("reset-password-submit-button").click()

    await expect(page.getByText("Passwords do not match")).toBeVisible()
  })

  test("rejects a password missing an uppercase letter", async ({ page }) => {
    await page.goto("/reset-password?token=not-a-real-token")

    await page.getByTestId("reset-password-password-input").fill("passw0rd")
    await page
      .getByTestId("reset-password-confirm-password-input")
      .fill("passw0rd")
    await page.getByTestId("reset-password-submit-button").click()

    await expect(
      page.getByText("Password must include an uppercase letter"),
    ).toBeVisible()
  })

  test("rejects a password missing a lowercase letter", async ({ page }) => {
    await page.goto("/reset-password?token=not-a-real-token")

    await page.getByTestId("reset-password-password-input").fill("PASSW0RD")
    await page
      .getByTestId("reset-password-confirm-password-input")
      .fill("PASSW0RD")
    await page.getByTestId("reset-password-submit-button").click()

    await expect(
      page.getByText("Password must include a lowercase letter"),
    ).toBeVisible()
  })

  test("rejects a password missing a number", async ({ page }) => {
    await page.goto("/reset-password?token=not-a-real-token")

    await page.getByTestId("reset-password-password-input").fill("Password")
    await page
      .getByTestId("reset-password-confirm-password-input")
      .fill("Password")
    await page.getByTestId("reset-password-submit-button").click()

    await expect(
      page.getByText("Password must include a number"),
    ).toBeVisible()
  })

  test("rejects a password shorter than 8 characters", async ({ page }) => {
    await page.goto("/reset-password?token=not-a-real-token")

    await page.getByTestId("reset-password-password-input").fill("Pas0rd")
    await page
      .getByTestId("reset-password-confirm-password-input")
      .fill("Pas0rd")
    await page.getByTestId("reset-password-submit-button").click()

    await expect(
      page.getByText("Password must be at least 8 characters"),
    ).toBeVisible()
  })

  test("rejects a password longer than 20 characters", async ({ page }) => {
    await page.goto("/reset-password?token=not-a-real-token")

    const longPassword = `Aa0${"a".repeat(19)}`
    await page
      .getByTestId("reset-password-password-input")
      .fill(longPassword)
    await page
      .getByTestId("reset-password-confirm-password-input")
      .fill(longPassword)
    await page.getByTestId("reset-password-submit-button").click()

    await expect(
      page.getByText("Password must be at most 20 characters"),
    ).toBeVisible()
  })

  test("rejects an invalid token", async ({ page }) => {
    await page.goto("/reset-password?token=not-a-real-token")

    await page.getByTestId("reset-password-password-input").fill("Passw0rd")
    await page
      .getByTestId("reset-password-confirm-password-input")
      .fill("Passw0rd")
    await page.getByTestId("reset-password-submit-button").click()

    await expect(page.getByText("Couldn't set password")).toBeVisible()
  })

  test("lets a new staff member set their password and sign in with it", async ({
    page,
    request,
  }) => {
    await seedAdmin()
    const staff = await createStaffAccountViaApi(request)

    const token = await getResetPasswordToken()
    await page.goto(`/reset-password?token=${token}`)
    await page.getByTestId("reset-password-password-input").fill("Passw0rd")
    await page
      .getByTestId("reset-password-confirm-password-input")
      .fill("Passw0rd")
    await page.getByTestId("reset-password-submit-button").click()

    await expect(page.getByText("Password set successfully")).toBeVisible()
    await page.waitForURL("/login")

    await page.getByTestId("login-email-input").fill(staff.email)
    await page.getByTestId("login-password-input").fill("Passw0rd")
    await page.getByTestId("login-submit-button").click()

    await expect(page.getByText("Signed in successfully")).toBeVisible()
    await page.waitForURL("/")
  })

  test("rejects reusing a token that's already been consumed", async ({
    page,
    request,
  }) => {
    await seedAdmin()
    await createStaffAccountViaApi(request)

    const token = await getResetPasswordToken()
    await page.goto(`/reset-password?token=${token}`)
    await page.getByTestId("reset-password-password-input").fill("Passw0rd")
    await page
      .getByTestId("reset-password-confirm-password-input")
      .fill("Passw0rd")
    await page.getByTestId("reset-password-submit-button").click()
    await page.waitForURL("/login")

    await page.goto(`/reset-password?token=${token}`)
    await page
      .getByTestId("reset-password-password-input")
      .fill("Another0rd")
    await page
      .getByTestId("reset-password-confirm-password-input")
      .fill("Another0rd")
    await page.getByTestId("reset-password-submit-button").click()

    await expect(page.getByText("Couldn't set password")).toBeVisible()
  })
})
