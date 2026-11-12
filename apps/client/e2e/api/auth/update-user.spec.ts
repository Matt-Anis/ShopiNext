import { test, expect } from "@playwright/test"
import { seedUser } from "../../utils/seed-user"
import { uniqueNameSuffix } from "../../utils/unique"

test("rejects a guest attempting to update a name directly", async ({
  request,
  baseURL,
}) => {
  const response = await request.post("/api/auth/update-user", {
    headers: { origin: baseURL! },
    data: { name: `AG ${uniqueNameSuffix()}` },
  })

  expect(response.status()).toBe(401)
  expect(await response.json()).toMatchObject({ code: "UNAUTHORIZED" })
})

test("rejects invalid names submitted directly without changing the account", async ({
  request,
  baseURL,
}) => {
  test.slow()

  const customer = await seedUser(request, {
    name: `AS ${uniqueNameSuffix()}`,
    email: "account-server-validation@example.com",
  })
  const signInResponse = await request.post("/api/auth/sign-in/email", {
    headers: { origin: baseURL! },
    data: { email: customer.email, password: customer.password },
  })
  expect(signInResponse.ok()).toBe(true)

  for (const { name, message } of [
    { name: " ", message: "Name is required" },
    { name: "A".repeat(21), message: "Name must be at most 20 characters" },
    { name: "Name123", message: "Name can only contain letters" },
  ]) {
    const response = await request.post("/api/auth/update-user", {
      headers: { origin: baseURL! },
      data: { name },
    })
    expect(response.status()).toBe(400)
    expect(await response.json()).toMatchObject({ message })

    const sessionResponse = await request.get("/api/auth/get-session")
    expect(sessionResponse.ok()).toBe(true)
    expect(await sessionResponse.json()).toMatchObject({
      user: { email: customer.email, name: customer.name },
    })
  }
})
