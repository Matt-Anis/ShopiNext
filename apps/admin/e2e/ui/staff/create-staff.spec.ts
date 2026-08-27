import { test, expect, type Page } from "@playwright/test"
import { eq } from "drizzle-orm"
import { adminUser, adminAccount } from "@repo/db/admin/auth-schema"
import { testDb, getResetPasswordToken } from "../../utils/db"
import { resetAuthTables } from "../../utils/db-reset"
import { seedAdmin, DEFAULT_TEST_ADMIN } from "../../utils/seed-user"

const NEW_STAFF = {
  name: "New Staff",
  email: "new.staff@example.com",
}

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

async function createStaff(page: Page) {
  await page.goto("/staff/new")
  await page.getByTestId("create-staff-name-input").fill(NEW_STAFF.name)
  await page.getByTestId("create-staff-email-input").fill(NEW_STAFF.email)
  await page.getByTestId("create-staff-submit-button").click()
}

test.describe("Create staff account", () => {
  test("creates the account without a password and requests a password reset", async ({
    page,
  }) => {
    await signIn(page)
    await createStaff(page)

    await expect(page.getByText("Staff account created")).toBeVisible()
    await page.waitForURL("/staff")

    const [user] = await testDb
      .select()
      .from(adminUser)
      .where(eq(adminUser.email, NEW_STAFF.email))
    expect(user).toBeDefined()
    expect(user!.role).toBe("user")

    const accounts = await testDb
      .select()
      .from(adminAccount)
      .where(eq(adminAccount.userId, user!.id))
    expect(accounts).toHaveLength(0)

    // Throws if no reset-password verification row exists.
    await expect(getResetPasswordToken()).resolves.toBeTruthy()
  })

  test("shows the new staff member on /staff with a Staff badge", async ({
    page,
  }) => {
    await signIn(page)
    await createStaff(page)
    await page.waitForURL("/staff")

    const row = page.locator("tr", { hasText: NEW_STAFF.email })
    await expect(row).toContainText(NEW_STAFF.name)
    await expect(row.getByText("Staff", { exact: true })).toBeVisible()
  })
})
