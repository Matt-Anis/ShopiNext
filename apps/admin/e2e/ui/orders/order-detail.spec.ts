import { test, expect } from "@playwright/test"
import { seedAdmin } from "../../utils/seed-user"
import { seedOrder, seedOrderItem } from "../../utils/seed-order"
import {
  seedProduct,
  seedProductOption,
  seedProductVariant,
} from "../../utils/seed-product"
import { signIn } from "../../utils/auth"
import { uniqueSuffix } from "../../utils/unique"

let admin: Awaited<ReturnType<typeof seedAdmin>>

test.beforeEach(async () => {
  admin = await seedAdmin()
})

test.describe("Order detail view", () => {
  test("shows order header with breadcrumb, id, status, and metadata", async ({
    page,
  }) => {
    const order = await seedOrder({
      checkoutEmail: `detail.${uniqueSuffix()}@example.com`,
      status: "processing",
    })

    await signIn(page, admin)
    await page.goto(`/orders/${order.id}`)

    await expect(page.getByText(`Order #${order.id.slice(0, 8)}`)).toBeVisible()
    await expect(
      page.getByRole("status").or(page.locator(".badge, [data-slot='badge']"))
    ).toContainText("Processing")
    await expect(page.getByText(order.checkoutEmail).first()).toBeVisible()
  })

  test("shows itemized products, variant options, and price totals", async ({
    page,
  }) => {
    const product = await seedProduct({
      name: `Premium Hoodie ${uniqueSuffix()}`,
    })
    const option = await seedProductOption(product.id, "Size", ["Large"])
    const variant = await seedProductVariant(
      product.id,
      { price: 4500 },
      [option.values[0]!.id]
    )

    const order = await seedOrder({
      totalAmount: 9000,
      status: "paid",
    })

    await seedOrderItem(order.id, variant.id, {
      priceAtPurchase: 4500,
      quantity: 2,
    })

    await signIn(page, admin)
    await page.goto(`/orders/${order.id}`)

    const itemsSection = page.locator("section", { hasText: "Items Ordered" })
    await expect(itemsSection).toBeVisible()
    await expect(itemsSection).toContainText(product.name)
    await expect(itemsSection).toContainText("Size: Large")
    await expect(itemsSection).toContainText("2")
    await expect(itemsSection).toContainText("$45.00")
    await expect(itemsSection).toContainText("$90.00")
  })

  test("shows customer card with email and stripe session link", async ({
    page,
  }) => {
    const order = await seedOrder({
      checkoutEmail: `stripe.${uniqueSuffix()}@example.com`,
      stripeSessionId: `cs_test_${uniqueSuffix()}`,
    })

    await signIn(page, admin)
    await page.goto(`/orders/${order.id}`)

    const customerCard = page.locator("section", { hasText: "Customer & Payment" })
    await expect(customerCard).toBeVisible()
    await expect(customerCard).toContainText(order.checkoutEmail)
    await expect(customerCard.getByText(order.stripeSessionId)).toBeVisible()
  })

  test("renders 404 page when order is not found", async ({ page }) => {
    await signIn(page, admin)
    const response = await page.goto(
      "/orders/00000000-0000-0000-0000-000000000000"
    )

    expect(response?.status()).toBe(404)
    await expect(page.getByText("404")).toBeVisible()
  })
})
