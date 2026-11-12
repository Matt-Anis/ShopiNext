import { test, expect } from "@playwright/test"
import { eq } from "drizzle-orm"
import { products, productVariants } from "@repo/db/public/schema"
import { signIn } from "../../utils/auth"
import { testDb } from "../../utils/db"
import { clickUntilHydrated } from "../../utils/interaction"
import { seedOrder, seedOrderItem } from "../../utils/seed-order"
import { seedProduct } from "../../utils/seed-product"
import { seedUser, getSeededUserId } from "../../utils/seed-user"
import { uniqueNameSuffix, uniqueSuffix } from "../../utils/unique"

test("keeps archived purchases and original prices when catalog items become unavailable", async ({
  page,
  request,
}) => {
  test.slow()

  const suffix = uniqueSuffix()
  const customer = await seedUser(request, {
    name: `OH ${uniqueNameSuffix()}`,
    email: "orders-history@example.com",
  })
  const product = await seedProduct({
    name: `Orders history original ${suffix}`,
    slug: "orders-history-product",
    price: 2500,
  })
  const order = await seedOrder({
    userId: await getSeededUserId(customer.email),
    checkoutEmail: customer.email,
    status: "delivered",
    archivedAt: new Date(),
    totalAmount: 7500,
  })
  await seedOrderItem(order.id, product.variant.id, { quantity: 3 })

  const currentName = `Orders history renamed ${suffix}`
  await testDb
    .update(productVariants)
    .set({ price: 9900, stock: 0, isActive: false })
    .where(eq(productVariants.id, product.variant.id))
  await testDb
    .update(products)
    .set({ name: currentName, status: "draft", isActive: false })
    .where(eq(products.id, product.id))

  await signIn(page, customer)
  await page.goto("/orders")
  const summary = page.locator(`[data-order-id="${order.id}"]`)
  await expect(summary).toContainText(currentName)
  await expect(summary).toContainText("Delivered")
  await expect(summary).toContainText("$75.00")

  await clickUntilHydrated(
    summary.locator(`a[href="/orders/${order.id}"]`),
    () => expect(page).toHaveURL(`/orders/${order.id}`)
  )
  const item = page.getByTestId("order-item").filter({ hasText: currentName })
  await expect(item).toContainText("No longer available")
  await expect(item.getByRole("link", { name: currentName })).toBeHidden()
  await expect(item.getByRole("cell").nth(1)).toHaveText("3")
  await expect(item.getByRole("cell").nth(2)).toHaveText("$25.00")
  await expect(item.getByRole("cell").nth(3)).toHaveText("$75.00")
  await expect(page.getByTestId("order-total")).toHaveText("$75.00")
})

test("paginates only the signed-in customers orders, newest first", async ({
  page,
  request,
}) => {
  test.slow()

  const customer = await seedUser(request, {
    name: `OP ${uniqueNameSuffix()}`,
    email: "orders-pagination@example.com",
  })
  const userId = await getSeededUserId(customer.email)
  const customerOrders = await Promise.all(
    Array.from({ length: 11 }, (_, index) =>
      seedOrder({
        userId,
        checkoutEmail: customer.email,
        createdAt: new Date(Date.UTC(2025, 0, index + 1)),
      })
    )
  )
  const guestOrder = await seedOrder({
    createdAt: new Date("2030-01-01T00:00:00Z"),
  })
  const oldest = customerOrders[0]!
  const newest = customerOrders[10]!

  await signIn(page, customer)
  await page.goto("/orders")
  const pagination = page.getByRole("navigation", {
    name: "Order history pagination",
  })
  await expect(pagination).toContainText("Page 1 of 2")
  await expect(
    pagination.getByRole("button", { name: "Previous", exact: true })
  ).toBeDisabled()
  for (const order of customerOrders.slice(1)) {
    await expect(page.locator(`[data-order-id="${order.id}"]`)).toBeVisible()
  }
  await expect(page.locator(`[data-order-id="${oldest.id}"]`)).toBeHidden()
  await expect(page.locator(`[data-order-id="${guestOrder.id}"]`)).toBeHidden()

  await clickUntilHydrated(pagination.locator('a[href="/orders?page=2"]'), () =>
    expect(page).toHaveURL(/\/orders\?page=2$/)
  )
  await expect(pagination).toContainText("Page 2 of 2")
  await expect(page.locator(`[data-order-id="${oldest.id}"]`)).toBeVisible()
  await expect(page.locator(`[data-order-id="${newest.id}"]`)).toBeHidden()
  await expect(page.locator(`[data-order-id="${guestOrder.id}"]`)).toBeHidden()
  await expect(
    pagination.getByRole("button", { name: "Next", exact: true })
  ).toBeDisabled()

  await clickUntilHydrated(pagination.locator('a[href="/orders"]'), () =>
    expect(page).toHaveURL(/\/orders$/)
  )
  await expect(page.locator(`[data-order-id="${newest.id}"]`)).toBeVisible()
  await expect(page.locator(`[data-order-id="${oldest.id}"]`)).toBeHidden()
})
