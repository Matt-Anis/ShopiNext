import { test, expect } from "@playwright/test"
import { signIn } from "../../utils/auth"
import { clickUntilHydrated } from "../../utils/interaction"
import { seedUser } from "../../utils/seed-user"
import { uniqueNameSuffix } from "../../utils/unique"

test("hides account navigation from guests and protects both account pages", async ({
  page,
}) => {
  await page.goto("/")
  await expect(page.getByTestId("signin-nav-button")).toBeVisible()
  await expect(page.getByTestId("user-menu-trigger")).toBeHidden()

  const accountPaths = ["/profile", "/profile/settings"]
  for (const path of accountPaths) {
    await expect(page.locator(`nav a[href="${path}"]`)).toBeHidden()
  }
  for (const path of accountPaths) {
    await page.goto(path)
    await expect(page).toHaveURL(/\/login$/)
    await expect(page.getByTestId("login-form")).toBeVisible()
  }
})

test("shows the signed-in customers details and connects account pages", async ({
  page,
  request,
}) => {
  test.slow()

  const customer = await seedUser(request, {
    name: `AP ${uniqueNameSuffix()}`,
    email: "account-profile@example.com",
  })
  await signIn(page, customer)
  const sessionResponse = await page.request.get("/api/auth/get-session")
  expect(sessionResponse.ok()).toBe(true)
  const { user } = await sessionResponse.json()
  expect(user.email).toBe(customer.email)

  const profileMenuItem = page.getByRole("menuitem", {
    name: "Profile",
    exact: true,
  })
  await clickUntilHydrated(page.getByTestId("user-menu-trigger"), () =>
    expect(profileMenuItem).toBeVisible()
  )
  await expect(
    page.getByRole("menuitem", { name: "Settings", exact: true })
  ).toHaveAttribute("href", "/profile/settings")
  await profileMenuItem.click()

  const main = page.getByRole("main")
  await expect(
    main.getByRole("heading", { name: "Your profile" })
  ).toBeVisible()
  const details = main.locator("dl")
  await expect(details.getByText(customer.name, { exact: true })).toBeVisible()
  await expect(details.getByText(customer.email, { exact: true })).toBeVisible()
  await expect(details.getByText("Verified", { exact: true })).toBeVisible()
  const createdAt = new Date(user.createdAt)
  await expect(details.locator("time")).toHaveAttribute(
    "datetime",
    createdAt.toISOString()
  )
  await expect(details.locator("time")).toHaveText(
    createdAt.toLocaleDateString("en-US", {
      dateStyle: "medium",
      timeZone: "UTC",
    })
  )

  const navigation = main.getByRole("navigation", {
    name: "Account",
    exact: true,
  })
  for (const { path, heading } of [
    { path: "/profile/settings", heading: "Account settings" },
    { path: "/orders", heading: "Your orders" },
    { path: "/profile", heading: "Your profile" },
  ]) {
    await clickUntilHydrated(navigation.locator(`a[href="${path}"]`), () =>
      expect(page).toHaveURL(path)
    )
    await expect(
      main.getByRole("heading", { name: heading, exact: true })
    ).toBeVisible()
    await expect(navigation.locator(`a[href="${path}"]`)).toHaveAttribute(
      "aria-current",
      "page"
    )
  }
})
