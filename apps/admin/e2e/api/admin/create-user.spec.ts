import { test, expect } from "@playwright/test"
import { eq } from "drizzle-orm"
import { adminUser } from "@repo/db/admin/auth-schema"
import { testDb } from "../../utils/db"
import { uniqueSuffix } from "../../utils/unique"

test.describe("POST /api/auth/admin/create-user — requires a session", () => {
  test("rejects the request when no session is present", async ({
    request,
  }) => {
    const response = await request.post("/api/auth/admin/create-user", {
      data: {
        name: "New Staff",
        email: `new.staff+${uniqueSuffix()}@example.com`,
        role: "user",
      },
    })

    expect(response.ok()).toBe(false)
  })

  test("does not create a user when the request is rejected", async ({
    request,
  }) => {
    const email = `new.staff+${uniqueSuffix()}@example.com`

    await request.post("/api/auth/admin/create-user", {
      data: {
        name: "New Staff",
        email,
        role: "user",
      },
    })

    const users = await testDb
      .select()
      .from(adminUser)
      .where(eq(adminUser.email, email))
    expect(users).toHaveLength(0)
  })
})
