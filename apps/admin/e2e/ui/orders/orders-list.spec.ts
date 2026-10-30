import { test, expect, type Page } from "@playwright/test"
import { eq } from "drizzle-orm"
import { orders } from "@repo/db/public/schema"
import { testDb } from "../../utils/db"
import { seedAdmin } from "../../utils/seed-user"
import { seedOrder, seedOrderItem } from "../../utils/seed-order"
import { seedProduct, seedProductVariant } from "../../utils/seed-product"
import { signIn } from "../../utils/auth"
import { uniqueSuffix } from "../../utils/unique"

let admin: Awaited<ReturnType<typeof seedAdmin>>

test.beforeEach(async () => {
  admin = await seedAdmin()
})

async function openRowMenu(page: Page, rowText: string) {
  const row = page.locator("tr", { hasText: rowText })
  const trigger = row.getByRole("button", { name: "Open menu" })
  const menu = page.getByRole("menu")

  await expect(async () => {
    await trigger.click()
    await expect(menu).toBeVisible({ timeout: 1000 })
  }).toPass({ timeout: 15_000 })
}

test.describe("Orders list", () => {
  test("shows active orders and hides archived orders", async ({ page }) => {
    const activeOrder = await seedOrder({
      checkoutEmail: `active.${uniqueSuffix()}@example.com`,
      totalAmount: 7500,
      status: "processing",
    })

    const archivedOrder = await seedOrder({
      checkoutEmail: `archived.${uniqueSuffix()}@example.com`,
      totalAmount: 12000,
      status: "paid",
      archivedAt: new Date(),
    })

    await signIn(page, admin)
    await page.goto("/orders")

    const activeRow = page.locator("tr", { hasText: activeOrder.checkoutEmail })
    await expect(activeRow).toBeVisible()
    await expect(activeRow).toContainText("Processing")
    await expect(activeRow).toContainText("$75.00")

    const archivedRow = page.locator("tr", {
      hasText: archivedOrder.checkoutEmail,
    })
    await expect(archivedRow).toHaveCount(0)
  })

  test("shows item count calculated from order items", async ({ page }) => {
    const product = await seedProduct({ name: `Tee ${uniqueSuffix()}` })
    const variant = await seedProductVariant(product.id, { price: 2500 })

    const order = await seedOrder({
      checkoutEmail: `items.${uniqueSuffix()}@example.com`,
      totalAmount: 5000,
    })

    await seedOrderItem(order.id, variant.id, {
      priceAtPurchase: 2500,
      quantity: 2,
    })

    await signIn(page, admin)
    await page.goto("/orders")

    const row = page.locator("tr", { hasText: order.checkoutEmail })
    await expect(row).toBeVisible()
    await expect(row.locator("td").nth(5)).toHaveText("2")
  })

  test("archives an active order from the row menu", async ({ page }) => {
    test.slow()

    const order = await seedOrder({
      checkoutEmail: `toarchive.${uniqueSuffix()}@example.com`,
      status: "paid",
    })

    await signIn(page, admin)
    await page.goto("/orders")

    const row = page.locator("tr", { hasText: order.checkoutEmail })
    await openRowMenu(page, order.checkoutEmail)
    await page.getByRole("menuitem", { name: "Archive" }).click()

    const confirmDialog = page.getByRole("alertdialog")
    await expect(confirmDialog).toBeVisible()
    await confirmDialog.getByRole("button", { name: "Archive" }).click()

    await expect(page.getByText("Order archived")).toBeVisible()
    await expect(confirmDialog).toBeHidden()
    await expect(row).toBeHidden()

    const [dbOrder] = await testDb
      .select()
      .from(orders)
      .where(eq(orders.id, order.id))
    expect(dbOrder?.archivedAt).not.toBeNull()

    await page.goto("/orders/archived")
    await expect(
      page.locator("tr", { hasText: order.checkoutEmail })
    ).toBeVisible()
  })

  test("unarchives an order from the archived orders row menu", async ({
    page,
  }) => {
    test.slow()

    const order = await seedOrder({
      checkoutEmail: `tounarchive.${uniqueSuffix()}@example.com`,
      status: "delivered",
      archivedAt: new Date(),
    })

    await signIn(page, admin)
    await page.goto("/orders/archived")

    const row = page.locator("tr", { hasText: order.checkoutEmail })
    await openRowMenu(page, order.checkoutEmail)
    await page.getByRole("menuitem", { name: "Unarchive" }).click()

    await expect(page.getByText("Order unarchived")).toBeVisible()
    await expect(row).toBeHidden()

    const [dbOrder] = await testDb
      .select()
      .from(orders)
      .where(eq(orders.id, order.id))
    expect(dbOrder?.archivedAt).toBeNull()

    await page.goto("/orders")
    await expect(
      page.locator("tr", { hasText: order.checkoutEmail })
    ).toBeVisible()
  })
})
