import { test, expect } from "@playwright/test"
import { getResetPasswordToken } from "../../utils/db"
import { seedAdmin, createStaffAccountViaApi } from "../../utils/seed-user"

test.describe("POST /api/auth/reset-password", () => {
  test("rejects a weak password, bypassing the form's client-side checks", async ({
    request,
  }) => {
    const admin = await seedAdmin()
    const staff = await createStaffAccountViaApi(request, admin)

    const token = await getResetPasswordToken(staff.id)
    const response = await request.post("/api/auth/reset-password", {
      data: { newPassword: "weak", token },
    })

    expect(response.ok()).toBe(false)
  })
})
