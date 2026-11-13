import { test, expect } from "@playwright/test"
import { seedUser } from "../../utils/seed-user"
import { signIn } from "../../utils/auth"
import { clickUntilHydrated } from "../../utils/interaction"
import { uniqueNameSuffix } from "../../utils/unique"

test.beforeEach(async ({ page, request }) => {
  const credentials = await seedUser(request, {
    name: `LO ${uniqueNameSuffix()}`,
  })
  await signIn(page, credentials)
  await clickUntilHydrated(page.getByTestId("account-nav-link"), () =>
    expect(page).toHaveURL("/profile")
  )
})

test.describe("Log out", () => {
  test("cancelling the confirmation keeps the user signed in", async ({
    page,
  }) => {
    test.slow()

    const dialog = page.getByRole("alertdialog", { name: "Log out?" })
    await clickUntilHydrated(page.getByTestId("logout-button"), () =>
      expect(dialog).toBeVisible()
    )
    await clickUntilHydrated(dialog.getByTestId("logout-cancel-button"), () =>
      expect(dialog).toBeHidden()
    )

    await expect(page).toHaveURL("/profile")
    await expect(page.getByTestId("account-nav-link")).toBeVisible()
    await expect(page.getByTestId("logout-button")).toBeVisible()
    await page.goto("/profile/settings")
    await expect(
      page.getByRole("heading", { name: "Account settings", exact: true })
    ).toBeVisible()
  })

  test("confirming logs the user out and protects account pages", async ({
    page,
  }) => {
    test.slow()

    const dialog = page.getByRole("alertdialog", { name: "Log out?" })
    await clickUntilHydrated(page.getByTestId("logout-button"), () =>
      expect(dialog).toBeVisible()
    )
    await clickUntilHydrated(dialog.getByTestId("logout-confirm-button"), () =>
      expect(page).toHaveURL("/")
    )

    await expect(page.getByTestId("signin-nav-button")).toBeVisible()
    await expect(page.getByTestId("account-nav-link")).toBeHidden()
    for (const path of ["/profile", "/profile/settings", "/orders"]) {
      await page.goto(path)
      await expect(page).toHaveURL("/login")
      await expect(page.getByTestId("login-form")).toBeVisible()
    }
  })

  test("shows a sign-out failure and allows retry without losing the session", async ({
    page,
  }) => {
    test.slow()

    const message = "Unable to sign out. Please try again."
    await page.route("**/api/auth/sign-out", (route) =>
      route.fulfill({ status: 503, json: { message } })
    )

    const dialog = page.getByRole("alertdialog", { name: "Log out?" })
    await clickUntilHydrated(page.getByTestId("logout-button"), () =>
      expect(dialog).toBeVisible()
    )
    await clickUntilHydrated(dialog.getByTestId("logout-confirm-button"), () =>
      expect(dialog.getByRole("alert")).toHaveText(message)
    )
    await expect(page).toHaveURL("/profile")
    await expect(page.getByTestId("account-nav-link")).toBeVisible()
    await expect(dialog.getByTestId("logout-confirm-button")).toBeEnabled()
    const sessionResponse = await page.request.get("/api/auth/get-session")
    expect(sessionResponse.ok()).toBe(true)
    const session = await sessionResponse.json()
    expect(session?.user).toBeTruthy()

    await page.unroute("**/api/auth/sign-out")
    await clickUntilHydrated(dialog.getByTestId("logout-confirm-button"), () =>
      expect(page).toHaveURL("/")
    )
    await expect(page.getByTestId("signin-nav-button")).toBeVisible()
    await expect(page.getByTestId("account-nav-link")).toBeHidden()
  })
})
