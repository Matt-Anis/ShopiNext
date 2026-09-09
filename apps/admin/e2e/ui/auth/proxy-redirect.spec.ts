import { test, expect } from "@playwright/test"
import { resetAuthTables } from "../../utils/db-reset"
import { seedAdmin } from "../../utils/seed-user"
import { signIn } from "../../utils/auth"

const SESSION_COOKIE_NAME = "better-auth.session_token"

test.beforeEach(async () => {
  await resetAuthTables()
})

test.describe("Protected route redirects", () => {
  test("redirects to /login when no session cookie is present", async ({
    page,
  }) => {
    await page.goto("/")

    await page.waitForURL("/login")
  })

  test("redirects to /login when the session cookie is forged", async ({
    page,
    context,
  }) => {
    // The proxy only checks that a cookie with this name exists — it
    // can't validate it. This forged value passes the proxy but must be
    // rejected by the (protected) layout's authoritative getSession() call.
    await context.addCookies([
      {
        name: SESSION_COOKIE_NAME,
        value: "forged-value",
        url: "http://localhost:3001",
      },
    ])

    await page.goto("/")

    await page.waitForURL("/login")
  })

  test("allows access to a protected route with a valid session", async ({
    page,
  }) => {
    await seedAdmin()
    await signIn(page)

    await expect(page).toHaveURL("/")
  })
})
