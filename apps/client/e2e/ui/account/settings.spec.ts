import { test, expect } from "@playwright/test"
import { signIn } from "../../utils/auth"
import { clickUntilHydrated } from "../../utils/interaction"
import { seedUser } from "../../utils/seed-user"
import { uniqueNameSuffix } from "../../utils/unique"

test("persists a name edit in the session and profile without changing another customer", async ({
  page,
  request,
  baseURL,
}) => {
  test.slow()

  const customer = await seedUser(request, {
    name: `AE ${uniqueNameSuffix()}`,
    email: "account-edit@example.com",
  })
  const otherCustomer = await seedUser(request, {
    name: `AX ${uniqueNameSuffix()}`,
    email: "account-edit-other@example.com",
  })
  const otherSignIn = await request.post("/api/auth/sign-in/email", {
    headers: { origin: baseURL! },
    data: { email: otherCustomer.email, password: otherCustomer.password },
  })
  expect(otherSignIn.ok()).toBe(true)

  await signIn(page, customer)
  await page.goto("/profile/settings")
  const main = page.getByRole("main")
  const nameInput = main.getByRole("textbox", {
    name: "Full name",
    exact: true,
  })
  await expect(nameInput).toHaveValue(customer.name)
  const updatedName = `AN ${uniqueNameSuffix()}`
  await nameInput.fill(updatedName)
  await clickUntilHydrated(
    main.getByRole("button", { name: "Save name" }),
    () => expect(page.getByText("Name updated", { exact: true })).toBeVisible()
  )

  await expect
    .poll(async () => {
      const response = await page.request.get("/api/auth/get-session")
      const session = await response.json()
      return session?.user?.name
    })
    .toBe(updatedName)

  await page.goto("/profile")
  await expect(
    main.locator("dl").getByText(updatedName, { exact: true })
  ).toBeVisible()
  await page.reload()
  await expect(
    main.locator("dl").getByText(updatedName, { exact: true })
  ).toBeVisible()
  await expect(main).toContainText(customer.email)
  await expect(main).not.toContainText(otherCustomer.email)

  const otherSessionResponse = await request.get("/api/auth/get-session")
  expect(otherSessionResponse.ok()).toBe(true)
  const otherSession = await otherSessionResponse.json()
  expect(otherSession).toMatchObject({
    user: { email: otherCustomer.email, name: otherCustomer.name },
  })
})

test("rejects invalid names in settings and keeps the saved name", async ({
  page,
  request,
}) => {
  test.slow()

  const customer = await seedUser(request, {
    name: `AV ${uniqueNameSuffix()}`,
    email: "account-validation@example.com",
  })
  await signIn(page, customer)
  await page.goto("/profile/settings")
  const main = page.getByRole("main")
  const nameInput = main.getByRole("textbox", {
    name: "Full name",
    exact: true,
  })
  await expect(nameInput).toHaveValue(customer.name)

  for (const { name, message } of [
    { name: "", message: "Name is required" },
    { name: "A".repeat(21), message: "Name must be at most 20 characters" },
    { name: "Name123", message: "Name can only contain letters" },
  ]) {
    await nameInput.fill(name)
    await clickUntilHydrated(
      main.getByRole("button", { name: "Save name" }),
      () => expect(main.getByRole("alert")).toHaveText(message)
    )
    await expect(nameInput).toHaveAttribute("aria-invalid", "true")
  }

  await page.reload()
  await expect(nameInput).toHaveValue(customer.name)
  await page.goto("/profile")
  await expect(
    main.locator("dl").getByText(customer.name, { exact: true })
  ).toBeVisible()
})
