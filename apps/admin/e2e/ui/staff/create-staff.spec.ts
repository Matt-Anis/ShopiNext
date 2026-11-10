import { test, expect, type Page } from "@playwright/test"
import { eq } from "drizzle-orm"
import { adminUser, adminAccount } from "@repo/db/admin/auth-schema"
import { testDb, getResetPasswordToken } from "../../utils/db"
import { clickUntilHydrated } from "../../utils/interaction"
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

async function createStaff(
  page: Page,
  staff: ReturnType<typeof newStaff>,
  role?: "staff" | "manager" | "owner" | "demo"
) {
  await page.goto("/staff/new")
  await page.getByTestId("create-staff-name-input").fill(staff.name)
  await page.getByTestId("create-staff-email-input").fill(staff.email)

  if (role) {
    const roleTrigger = page.getByTestId("create-staff-role-trigger")
    const roleOption = page.getByTestId(`create-staff-role-option-${role}`)
    await clickUntilHydrated(roleTrigger, async () => {
      await expect(roleOption).toBeVisible()
    })
    await roleOption.click()
  }

  await page.getByTestId("create-staff-submit-button").click()
}

test.describe("Create staff account", () => {
  test("creates the account without a password and requests a password reset", async ({
    page,
  }) => {
    test.slow()

    const staff = newStaff()
    await signIn(page, admin)
    await createStaff(page, staff)

    await expect(page.getByText("Staff account created")).toBeVisible()
    await page.waitForURL("/staff")

    await expect
      .poll(async () => {
        const [user] = await testDb
          .select()
          .from(adminUser)
          .where(eq(adminUser.email, staff.email))
        return user?.role
      })
      .toBe("staff")

    const [user] = await testDb
      .select()
      .from(adminUser)
      .where(eq(adminUser.email, staff.email))
    expect(user).toBeDefined()

    const accounts = await testDb
      .select()
      .from(adminAccount)
      .where(eq(adminAccount.userId, user!.id))
    expect(accounts).toHaveLength(0)

    await expect(getResetPasswordToken(user!.id)).resolves.toBeTruthy()
  })

  test("creates a staff member with a selected RBAC role and displays it on /staff", async ({
    page,
  }) => {
    test.slow()

    const staff = newStaff()
    await signIn(page, admin)
    await createStaff(page, staff, "manager")

    await expect(page.getByText("Staff account created")).toBeVisible()
    await page.waitForURL("/staff")

    const row = page.locator("tr", { hasText: staff.email })
    await expect(row).toBeVisible()
    await expect(row).toContainText(staff.name)
    await expect(row).toContainText("Manager")
    await expect(row).toContainText("Unverified")

    await expect
      .poll(async () => {
        const [user] = await testDb
          .select({ role: adminUser.role, name: adminUser.name })
          .from(adminUser)
          .where(eq(adminUser.email, staff.email))
        return user
      })
      .toEqual({ role: "manager", name: staff.name })
  })
})
