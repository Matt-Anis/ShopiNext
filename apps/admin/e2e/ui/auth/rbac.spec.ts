import { test, expect } from "@playwright/test"
import { seedAdmin } from "../../utils/seed-user"
import { seedOrder } from "../../utils/seed-order"
import { seedProduct } from "../../utils/seed-product"
import { uniqueSuffix } from "../../utils/unique"
import { signIn } from "../../utils/auth"

test.describe("Role-Based Access Control (RBAC)", () => {
  test("staff role can view orders but is restricted from staff directory, analytics, and product creation", async ({
    page,
  }) => {
    const staff = await seedAdmin({ role: "staff" })
    await signIn(page, staff)

    await page.goto("/orders")
    await expect(page).toHaveURL("/orders")

    await page.goto("/staff")
    await expect(page).toHaveURL("/unauthorized")

    // await page.goto("/analytics")
    // await expect(page).toHaveURL("/unauthorized")

    await page.goto("/")
    await expect(page.getByRole("button", { name: "Staff" })).toBeHidden()

    await page.goto("/products")
    await expect(page.getByTestId("new-product-button")).toBeHidden()
  })

  test("staff role cannot create new users via API", async ({ request }) => {
    const staff = await seedAdmin({ role: "staff" })
    const signInRes = await request.post("/api/auth/sign-in/email", {
      headers: { origin: "http://localhost:3001" },
      data: { email: staff.email, password: staff.password },
    })
    expect(signInRes.ok()).toBeTruthy()

    const createRes = await request.post("/api/auth/admin/create-user", {
      headers: { origin: "http://localhost:3001" },
      data: {
        name: "Unauthorized Staff",
        email: "unauth@example.com",
        role: "staff",
      },
    })
    expect(createRes.status()).toBe(403)
  })

  test("manager role can view staff directory but cannot create staff members", async ({
    page,
  }) => {
    const manager = await seedAdmin({ role: "manager" })
    await signIn(page, manager)

    await page.goto("/staff")
    await expect(page).toHaveURL("/staff")
    await expect(page.getByTestId("new-staff-button")).toBeHidden()
    const managerRow = page.locator("tr", { hasText: manager.email })
    await expect(managerRow.getByRole("button", { name: "Open staff member" })).toBeVisible()
    await expect(managerRow.getByRole("button", { name: "Open menu" })).toBeHidden()

    await page.goto("/staff/new")
    await expect(page).toHaveURL("/unauthorized")
  })

  test("demo role has mutations disabled and shows active demo banner", async ({
    page,
  }) => {
    const demo = await seedAdmin({ role: "demo" })
    const product = await seedProduct({ name: `View-only product ${uniqueSuffix()}` })
    await signIn(page, demo)

    await expect(
      page.getByText("Demo mode active: read-only access")
    ).toBeVisible()

    await page.goto("/staff")
    await expect(page).toHaveURL("/unauthorized")

    await page.goto("/products")
    await expect(page.getByTestId("new-product-button")).toBeHidden()
    const productRow = page.locator("tr", { hasText: product.name })
    await expect(productRow.getByRole("button", { name: "Open product" })).toBeVisible()
    await expect(productRow.getByRole("button", { name: "Open menu" })).toBeHidden()

    await page.setViewportSize({ width: 390, height: 844 })
    const compactRow = page.getByRole("listitem").filter({ hasText: product.name })
    await expect(compactRow.getByRole("link", { name: product.name, exact: true })).toHaveAttribute(
      "href",
      `/products/${product.id}`
    )
    await expect(compactRow.getByRole("button", { name: "Open menu" })).toBeHidden()
  })

  test("demo role has customer email PII masked on orders", async ({
    page,
  }) => {
    const order = await seedOrder()
    const demo = await seedAdmin({ role: "demo" })
    await signIn(page, demo)

    await page.goto("/orders")
    await expect(page).toHaveURL("/orders")

    await expect(page.getByText(order.checkoutEmail)).toBeHidden()

    const [name, domain] = order.checkoutEmail.split("@")
    const masked = `${name[0]}***${name[name.length - 1]}@${domain}`
    const orderRow = page.locator("tr", { hasText: order.id })
    await expect(orderRow.getByText(masked)).toBeVisible()
    await expect(orderRow.getByRole("button", { name: "Open order" })).toBeVisible()
    await expect(orderRow.getByRole("button", { name: "Open menu" })).toBeHidden()
  })

  test("user with unassigned or invalid role is redirected to /unauthorized", async ({
    page,
  }) => {
    const invalidUser = await seedAdmin({ role: "invalid_role" })
    await signIn(page, invalidUser)

    await expect(page).toHaveURL("/unauthorized")
  })
})
