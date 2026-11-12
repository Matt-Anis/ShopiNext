import {
  expect,
  request,
  type APIRequestContext,
  type Page,
} from "@playwright/test"
import type { DEFAULT_TEST_USER } from "./seed-user"

type CustomerSession = {
  session: { id: string; createdAt: string }
  user: { id: string; email: string }
}

export async function createCustomerSession(
  baseURL: string,
  credentials: Pick<typeof DEFAULT_TEST_USER, "email" | "password">,
  userAgent?: string
) {
  const context = await request.newContext({
    baseURL,
    userAgent,
    extraHTTPHeaders: { origin: baseURL },
  })

  try {
    const response = await context.post("/api/auth/sign-in/email", {
      data: { email: credentials.email, password: credentials.password },
    })
    expect(response.ok()).toBe(true)
    return context
  } catch (error) {
    await context.dispose()
    throw error
  }
}

export async function snapshotCustomerSession(page: Page, baseURL: string) {
  const context = await request.newContext({
    baseURL,
    storageState: await page.context().storageState(),
  })

  try {
    expect(await readCustomerSession(context)).not.toBeNull()
    return context
  } catch (error) {
    await context.dispose()
    throw error
  }
}

export async function readCustomerSession(
  context: APIRequestContext
): Promise<CustomerSession | null> {
  const response = await context.get("/api/auth/get-session", {
    params: { disableCookieCache: "true" },
  })
  expect(response.ok()).toBe(true)
  return response.json()
}
