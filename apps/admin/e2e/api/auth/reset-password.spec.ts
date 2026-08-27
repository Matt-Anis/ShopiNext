import { test, expect } from "@playwright/test"
import { getResetPasswordToken } from "../../utils/db"
import { resetAuthTables } from "../../utils/db-reset"
import { seedAdmin, createStaffAccountViaApi } from "../../utils/seed-user"

test.beforeEach(async () => {
  await resetAuthTables()
})

test.describe("POST /api/auth/reset-password", () => {
  test("rejects a weak password, bypassing the form's client-side checks", async ({
    request,
  }) => {
    await seedAdmin()
    await createStaffAccountViaApi(request)

    const token = await getResetPasswordToken()
    const response = await request.post("/api/auth/reset-password", {
      data: { newPassword: "weak", token },
    })

    expect(response.ok()).toBe(false)
  })
})
