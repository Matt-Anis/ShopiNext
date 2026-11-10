import { randomUUID } from "node:crypto"
import { expect, test } from "@playwright/test"
import { eq } from "drizzle-orm"

import { adminSession, adminUser } from "@repo/db/admin/auth-schema"
import { signIn } from "../../utils/auth"
import { testDb } from "../../utils/db"
import { clickUntilHydrated } from "../../utils/interaction"
import { seedAdmin } from "../../utils/seed-user"
import { uniqueSuffix } from "../../utils/unique"

let admin: Awaited<ReturnType<typeof seedAdmin>>

test.beforeEach(async () => {
  admin = await seedAdmin({ role: "owner" })
})

test.describe("Staff detail and session management", () => {
  test("owner can update a staff member's profile and role", async ({
    page,
  }) => {
    test.slow()

    const suffix = uniqueSuffix()
    const target = await seedAdmin({
      name: `Initial Staff ${suffix}`,
      role: "staff",
    })

    const updatedName = `Updated Staff ${suffix}`
    const updatedEmail = `updated.staff.${suffix}@example.com`

    await signIn(page, admin)
    await page.goto(`/staff/${target.id}`)

    await expect(page.getByTestId("staff-detail-name")).toHaveText(target.name)
    await expect(page.getByTestId("staff-detail-role-badge")).toHaveText(
      "Staff"
    )

    const nameInput = page.getByTestId("staff-profile-name-input")
    const emailInput = page.getByTestId("staff-profile-email-input")
    await clickUntilHydrated(nameInput, async () => {
      await nameInput.fill(updatedName)
      await expect(nameInput).toHaveValue(updatedName)
    })
    await emailInput.fill(updatedEmail)

    const saveProfileButton = page.getByTestId("staff-profile-save-button")
    await expect(saveProfileButton).toBeEnabled()
    await saveProfileButton.click()

    await expect(page.getByTestId("staff-detail-name")).toHaveText(updatedName)
    await expect(page.getByTestId("staff-detail-email")).toContainText(
      updatedEmail
    )

    await expect
      .poll(async () => {
        const [row] = await testDb
          .select({ name: adminUser.name, email: adminUser.email })
          .from(adminUser)
          .where(eq(adminUser.id, target.id))
        return row
      })
      .toEqual({ name: updatedName, email: updatedEmail })

    const roleTrigger = page.getByTestId("staff-role-trigger")
    const managerOption = page.getByTestId("staff-role-option-manager")
    await clickUntilHydrated(roleTrigger, async () => {
      await expect(managerOption).toBeVisible()
    })
    await managerOption.click()

    const saveRoleButton = page.getByTestId("staff-role-save-button")
    await expect(saveRoleButton).toBeEnabled()
    await saveRoleButton.click()

    await expect(page.getByTestId("staff-detail-role-badge")).toHaveText(
      "Manager"
    )

    await expect
      .poll(async () => {
        const [row] = await testDb
          .select({ role: adminUser.role })
          .from(adminUser)
          .where(eq(adminUser.id, target.id))
        return row?.role
      })
      .toBe("manager")
  })

  test("owner can view and revoke a staff member's active session", async ({
    page,
  }) => {
    test.slow()

    const suffix = uniqueSuffix()
    const target = await seedAdmin({
      name: `Session Staff ${suffix}`,
      role: "staff",
    })

    const sessionId = randomUUID()
    await testDb.insert(adminSession).values({
      id: sessionId,
      userId: target.id,
      token: `token-${sessionId}-${suffix}`,
      ipAddress: "192.0.2.42",
      userAgent: "Mozilla/5.0 (X11; Linux x86_64) Chrome/130.0.0.0",
      createdAt: new Date(),
      updatedAt: new Date(),
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
    })

    await signIn(page, admin)
    await page.goto(`/staff/${target.id}`)

    const sessionRow = page.getByTestId(`staff-session-row-${sessionId}`)
    await expect(sessionRow).toBeVisible()
    await expect(sessionRow).toContainText("192.0.2.42")

    const revokeButton = page.getByTestId(`revoke-session-${sessionId}`)
    await clickUntilHydrated(revokeButton, async () => {
      await expect(sessionRow).toBeHidden()
    })

    await expect
      .poll(async () => {
        const rows = await testDb
          .select({ id: adminSession.id })
          .from(adminSession)
          .where(eq(adminSession.id, sessionId))
        return rows.length
      })
      .toBe(0)
  })

  test("owner can ban, unban, and delete a staff member", async ({ page }) => {
    test.slow()

    const suffix = uniqueSuffix()
    const target = await seedAdmin({
      name: `Lifecycle Staff ${suffix}`,
      role: "staff",
    })
    const banReason = `Policy violation ${suffix}`

    await signIn(page, admin)
    await page.goto(`/staff/${target.id}`)

    const banButton = page.getByTestId("staff-ban-button")
    const reasonInput = page.getByTestId("staff-ban-reason-input")
    await clickUntilHydrated(banButton, async () => {
      await expect(reasonInput).toBeVisible()
    })

    await reasonInput.fill(banReason)
    await page.getByRole("button", { name: "Ban account" }).last().click()

    await expect(page.getByTestId("staff-detail-banned-badge")).toBeVisible()
    await expect(page.getByTestId("staff-unban-button")).toBeVisible()

    await expect
      .poll(async () => {
        const [row] = await testDb
          .select({
            banned: adminUser.banned,
            banReason: adminUser.banReason,
          })
          .from(adminUser)
          .where(eq(adminUser.id, target.id))
        return row
      })
      .toEqual({ banned: true, banReason })

    await page.getByTestId("staff-unban-button").click()

    await expect(page.getByTestId("staff-detail-banned-badge")).toBeHidden()
    await expect(page.getByTestId("staff-ban-button")).toBeVisible()

    await expect
      .poll(async () => {
        const [row] = await testDb
          .select({
            banned: adminUser.banned,
            banReason: adminUser.banReason,
          })
          .from(adminUser)
          .where(eq(adminUser.id, target.id))
        return row
      })
      .toEqual({ banned: false, banReason: null })

    const deleteButton = page.getByTestId("staff-delete-button")
    await clickUntilHydrated(deleteButton, async () => {
      await expect(
        page.getByRole("alertdialog", { name: new RegExp(target.name) })
      ).toBeVisible()
    })

    await page
      .getByRole("alertdialog")
      .getByRole("button", { name: "Delete account" })
      .click()

    await expect(page.getByText("Staff account deleted")).toBeVisible()
    await page.waitForURL("/staff")
    const deletedRow = page.locator("tr", { hasText: target.email })
    await expect(deletedRow).toBeHidden()

    await expect
      .poll(async () => {
        const rows = await testDb
          .select({ id: adminUser.id })
          .from(adminUser)
          .where(eq(adminUser.id, target.id))
        return rows.length
      })
      .toBe(0)
  })

  test("owner cannot change their own role, ban, delete, or revoke their current session", async ({
    page,
  }) => {
    await signIn(page, admin)
    await page.goto(`/staff/${admin.id}`)

    await expect(page.getByTestId("staff-role-trigger")).toBeDisabled()
    await expect(page.getByTestId("staff-role-save-button")).toBeHidden()
    await expect(page.getByTestId("staff-ban-button")).toBeDisabled()
    await expect(page.getByTestId("staff-delete-button")).toBeDisabled()
    await expect(
      page.getByTestId("staff-sessions-card").getByText("Current")
    ).toBeVisible()
  })

  test("manager can view staff details and sessions in read-only mode", async ({
    page,
  }) => {
    const manager = await seedAdmin({ role: "manager" })
    const suffix = uniqueSuffix()
    const target = await seedAdmin({
      name: `Readonly Target ${suffix}`,
      role: "staff",
    })

    const sessionId = randomUUID()
    await testDb.insert(adminSession).values({
      id: sessionId,
      userId: target.id,
      token: `token-${sessionId}-${suffix}`,
      ipAddress: "198.51.100.7",
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X)",
      createdAt: new Date(),
      updatedAt: new Date(),
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
    })

    await signIn(page, manager)
    await page.goto(`/staff/${target.id}`)

    await expect(page.getByTestId("staff-detail-name")).toHaveText(target.name)
    await expect(page.getByTestId("staff-profile-name-input")).toBeDisabled()
    await expect(page.getByTestId("staff-profile-email-input")).toBeDisabled()
    await expect(page.getByTestId("staff-profile-save-button")).toBeHidden()
    await expect(page.getByTestId("staff-role-trigger")).toBeDisabled()
    await expect(page.getByTestId("staff-role-save-button")).toBeHidden()
    await expect(page.getByTestId("staff-security-card")).toBeHidden()

    const sessionRow = page.getByTestId(`staff-session-row-${sessionId}`)
    await expect(sessionRow).toBeVisible()
    await expect(page.getByTestId(`revoke-session-${sessionId}`)).toBeHidden()
  })

  test("renders 404 page when staff member is not found", async ({ page }) => {
    await signIn(page, admin)
    const response = await page.goto(
      "/staff/00000000-0000-0000-0000-000000000000"
    )

    expect(response?.status()).toBe(404)
    await expect(page.getByText("404")).toBeVisible()
  })
})
