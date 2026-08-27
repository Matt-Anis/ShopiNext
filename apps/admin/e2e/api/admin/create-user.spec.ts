import { test, expect } from "@playwright/test"
import { eq } from "drizzle-orm"
import { adminUser } from "@repo/db/admin/auth-schema"
import { testDb } from "../../utils/db"
import { resetAuthTables } from "../../utils/db-reset"

test.beforeEach(async () => {
  await resetAuthTables()
})

test.describe("POST /api/auth/admin/create-user — requires a session", () => {
  test("rejects the request when no session is present", async ({
    request,
  }) => {
    const response = await request.post("/api/auth/admin/create-user", {
      data: {
        name: "New Staff",
        email: "new.staff@example.com",
        role: "user",
      },
    })

    expect(response.ok()).toBe(false)
  })

  test("does not create a user when the request is rejected", async ({
    request,
  }) => {
    await request.post("/api/auth/admin/create-user", {
      data: {
        name: "New Staff",
        email: "new.staff@example.com",
        role: "user",
      },
    })

    const users = await testDb
      .select()
      .from(adminUser)
      .where(eq(adminUser.email, "new.staff@example.com"))
    expect(users).toHaveLength(0)
  })
})
