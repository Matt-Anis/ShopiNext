import { test, expect } from "@playwright/test"
import { resetAuthTables } from "../../utils/db-reset"

test.beforeEach(async () => {
  await resetAuthTables()
})

test.describe("POST /api/auth/sign-up/email — disabled", () => {
  test("rejects sign-up requests against the disabled endpoint", async ({
    request,
  }) => {
    const response = await request.post("/api/auth/sign-up/email", {
      data: {
        name: "New Admin",
        email: "new.admin@example.com",
        password: "password123",
      },
    })

    expect(response.status()).toBe(400)
  })

  test("does not create a user when sign-up is rejected", async ({
    request,
  }) => {
    await request.post("/api/auth/sign-up/email", {
      data: {
        name: "New Admin",
        email: "new.admin@example.com",
        password: "password123",
      },
    })

    const signInResponse = await request.post("/api/auth/sign-in/email", {
      data: { email: "new.admin@example.com", password: "password123" },
    })

    expect(signInResponse.ok()).toBe(false)
  })
})
