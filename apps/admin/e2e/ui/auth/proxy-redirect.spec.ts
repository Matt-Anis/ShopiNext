import { test, expect } from "@playwright/test"
import { seedAdmin } from "../../utils/seed-user"
import { signIn } from "../../utils/auth"

const SESSION_COOKIE_NAME = "better-auth.session_token"

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
    const admin = await seedAdmin()
    await signIn(page, admin)

    await expect(page).toHaveURL("/")
  })
})
