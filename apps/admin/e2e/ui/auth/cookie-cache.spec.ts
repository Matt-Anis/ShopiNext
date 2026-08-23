import { test, expect, type Page } from "@playwright/test"
import { adminSession } from "@repo/db/admin/auth-schema"
import { testDb } from "../../utils/db"
import { resetAuthTables } from "../../utils/db-reset"
import { seedAdmin, DEFAULT_TEST_ADMIN } from "../../utils/seed-user"
import { TEST_COOKIE_CACHE_MAX_AGE_SECONDS } from "../../../playwright.config"

test.beforeEach(async () => {
  await resetAuthTables()
  await seedAdmin()
})

async function signIn(page: Page) {
  await page.goto("/login")
  await page.getByTestId("login-email-input").fill(DEFAULT_TEST_ADMIN.email)
  await page
    .getByTestId("login-password-input")
    .fill(DEFAULT_TEST_ADMIN.password)
  await page.getByTestId("login-submit-button").click()
  await page.waitForURL("/")
}

test.describe("Session cookie cache", () => {
  test("serves a cached session within maxAge even if the DB session is gone", async ({
    page,
  }) => {
    await signIn(page)

    // Delete the underlying session row directly. If the (protected) layout's
    // getSession() call is still reading from the signed cache cookie, this
    // shouldn't matter yet — it's not supposed to hit the DB within maxAge.
    await testDb.delete(adminSession)

    await page.reload()

    await expect(page).toHaveURL("/")
  })

  test("falls back to a fresh DB check once the cache is stale, without logging out a still-valid session", async ({
    page,
  }) => {
    await signIn(page)

    await page.waitForTimeout((TEST_COOKIE_CACHE_MAX_AGE_SECONDS + 2) * 1000)

    // The DB session was never touched, so once the cache goes stale and
    // getSession() falls back to a real lookup, it should still succeed.
    await page.reload()

    await expect(page).toHaveURL("/")
  })
})
