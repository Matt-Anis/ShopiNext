import { test, expect } from "@playwright/test"
import { and, eq, like } from "drizzle-orm"
import { account, verification } from "@repo/db/public/auth-schema"
import { signIn } from "../../utils/auth"
import {
  createCustomerSession,
  readCustomerSession,
  snapshotCustomerSession,
} from "../../utils/customer-session"
import { testDb } from "../../utils/db"
import { clickUntilHydrated } from "../../utils/interaction"
import { seedGoogleUser } from "../../utils/seed-google-user"
import { getSeededUserId, seedUser } from "../../utils/seed-user"
import { uniqueNameSuffix, uniqueSuffix } from "../../utils/unique"

test("requests a password reset for the customer without revoking existing sessions", async ({
  page,
  request,
  baseURL,
}) => {
  test.slow()

  const customer = await seedUser(request, {
    name: `PR ${uniqueNameSuffix()}`,
    email: "password-request@example.com",
  })
  const userId = await getSeededUserId(customer.email)
  await signIn(page, customer)
  const current = await readCustomerSession(page.request)
  expect(current?.user.email).toBe(customer.email)

  const originalSession = await snapshotCustomerSession(page, baseURL!)
  const otherSession = await createCustomerSession(baseURL!, customer)
  try {
    const other = await readCustomerSession(otherSession)
    expect(other?.user.email).toBe(customer.email)
    expect(other?.session.id).not.toBe(current?.session.id)

    await page.goto("/profile/settings")
    const passwordCard = page.getByRole("main").locator("[data-slot='card']", {
      has: page.getByRole("heading", { name: "Password", exact: true }),
    })
    await expect(passwordCard).toContainText(customer.email)

    const resetResponse = page.waitForResponse(
      (response) =>
        new URL(response.url()).pathname ===
          "/api/auth/request-password-reset" &&
        response.request().method() === "POST"
    )
    await clickUntilHydrated(
      passwordCard.getByRole("button", {
        name: "Send password reset email",
        exact: true,
      }),
      () =>
        expect(passwordCard.getByRole("status")).toHaveText(
          "Check your inbox for a link to reset your password."
        )
    )
    const response = await resetResponse
    expect(response.ok()).toBe(true)
    expect(response.request().postDataJSON()).toEqual({
      email: customer.email,
      redirectTo: "/reset-password",
    })

    await expect
      .poll(async () => {
        const [reset] = await testDb
          .select({ id: verification.id })
          .from(verification)
          .where(
            and(
              eq(verification.value, userId),
              like(verification.identifier, "reset-password:%")
            )
          )
          .limit(1)
        return reset?.id
      })
      .toBeTruthy()

    await expect
      .poll(() => readCustomerSession(originalSession))
      .toMatchObject({
        session: { id: current?.session.id },
        user: { email: customer.email },
      })
    await expect
      .poll(() => readCustomerSession(otherSession))
      .toMatchObject({
        session: { id: other?.session.id },
        user: { email: customer.email },
      })
    await expect(page).toHaveURL("/profile/settings")
  } finally {
    await originalSession.dispose()
    await otherSession.dispose()
  }
})

test("guides Google-only customers and rejects reset requests and pre-existing reset links", async ({
  page,
  baseURL,
}) => {
  test.slow()

  const customer = await seedGoogleUser(page)
  const token = `google-reset-${uniqueSuffix()}`
  const verificationId = `google-reset-${uniqueSuffix()}`
  await testDb.insert(verification).values({
    id: verificationId,
    identifier: `reset-password:${token}`,
    value: customer.userId,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
  })

  await page.goto("/profile/settings")
  const passwordCard = page.getByRole("main").locator("[data-slot='card']", {
    has: page.getByRole("heading", { name: "Password", exact: true }),
  })
  await expect(passwordCard).toContainText(
    "Your password is managed through Google."
  )
  await expect(
    passwordCard.getByRole("link", { name: /Google Account security/ })
  ).toHaveAttribute("href", "https://myaccount.google.com/security")
  await expect(
    passwordCard.getByRole("button", { name: "Send password reset email" })
  ).toBeHidden()

  const requestResponse = await page.request.post(
    "/api/auth/request-password-reset",
    {
      headers: { origin: baseURL! },
      data: { email: customer.email, redirectTo: "/reset-password" },
    }
  )
  expect(requestResponse.ok()).toBe(true)
  expect(await requestResponse.json()).toMatchObject({
    status: true,
    message:
      "If this email exists in our system, check your email for the reset link",
  })
  await expect
    .poll(() =>
      testDb
        .select({ id: verification.id })
        .from(verification)
        .where(
          and(
            eq(verification.value, customer.userId),
            like(verification.identifier, "reset-password:%")
          )
        )
    )
    .toEqual([{ id: verificationId }])

  const resetResponse = await page.request.post("/api/auth/reset-password", {
    headers: { origin: baseURL! },
    data: { token, newPassword: `N${uniqueSuffix()}` },
  })
  expect(resetResponse.status()).toBe(400)
  expect(await resetResponse.json()).toMatchObject({
    message: "Invalid or expired reset link",
  })
  await expect
    .poll(() =>
      testDb
        .select({ providerId: account.providerId, password: account.password })
        .from(account)
        .where(eq(account.userId, customer.userId))
    )
    .toEqual([{ providerId: "google", password: null }])
  await expect
    .poll(() => readCustomerSession(page.request))
    .toMatchObject({
      user: { id: customer.userId },
    })
})
