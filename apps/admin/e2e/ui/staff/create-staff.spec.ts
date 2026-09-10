import { test, expect, type Page } from "@playwright/test"
import { eq } from "drizzle-orm"
import { adminUser, adminAccount } from "@repo/db/admin/auth-schema"
import { testDb, getResetPasswordToken } from "../../utils/db"
import { seedAdmin } from "../../utils/seed-user"
import { signIn } from "../../utils/auth"
import { uniqueSuffix } from "../../utils/unique"

let admin: Awaited<ReturnType<typeof seedAdmin>>

test.beforeEach(async () => {
  admin = await seedAdmin()
})

function newStaff() {
  const suffix = uniqueSuffix()
  return { name: `New Staff ${suffix}`, email: `new.staff+${suffix}@example.com` }
}

async function createStaff(page: Page, staff: ReturnType<typeof newStaff>) {
  await page.goto("/staff/new")
  await page.getByTestId("create-staff-name-input").fill(staff.name)
  await page.getByTestId("create-staff-email-input").fill(staff.email)
  await page.getByTestId("create-staff-submit-button").click()
}

test.describe("Create staff account", () => {
  test("creates the account without a password and requests a password reset", async ({
    page,
  }) => {
    const staff = newStaff()
    await signIn(page, admin)
    await createStaff(page, staff)

    await expect(page.getByText("Staff account created")).toBeVisible()
    await page.waitForURL("/staff")

    const [user] = await testDb
      .select()
      .from(adminUser)
      .where(eq(adminUser.email, staff.email))
    expect(user).toBeDefined()
    expect(user!.role).toBe("user")

    const accounts = await testDb
      .select()
      .from(adminAccount)
      .where(eq(adminAccount.userId, user!.id))
    expect(accounts).toHaveLength(0)

    await expect(getResetPasswordToken(user!.id)).resolves.toBeTruthy()
  })
})
