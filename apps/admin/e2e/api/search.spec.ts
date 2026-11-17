import { expect, test } from "@playwright/test"

test("search returns uncached JSON rather than a login redirect without a session", async ({
  request,
}) => {
  const response = await request.get("/api/search?q=shirt", { maxRedirects: 0 })
  expect(response.status()).toBe(401)
  expect(response.headers()["content-type"]).toContain("application/json")
  expect(response.headers()["cache-control"]).toBe("private, no-store")
  expect(await response.json()).toEqual({
    error: "Sign in to search the admin app.",
  })
})
