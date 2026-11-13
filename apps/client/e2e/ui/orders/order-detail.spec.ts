import { test, expect } from "@playwright/test"
import { eq } from "drizzle-orm"
import { productVariants } from "@repo/db/public/schema"
import { signIn } from "../../utils/auth"
import { testDb } from "../../utils/db"
import { clickUntilHydrated } from "../../utils/interaction"
import {
  seedOrder,
  seedOrderItem,
  seedOrderStaffNote,
  seedOrderTimelineEvent,
} from "../../utils/seed-order"
import { seedProductWithVariants } from "../../utils/seed-product"
import { seedUser, getSeededUserId } from "../../utils/seed-user"
import { uniqueNameSuffix, uniqueSuffix } from "../../utils/unique"

test("shows purchased items and chronological public history without staff notes", async ({
  page,
  request,
}) => {
  test.slow()

  const suffix = uniqueSuffix()
  const customer = await seedUser(request, {
    name: `OD ${uniqueNameSuffix()}`,
    email: "orders-detail@example.com",
  })
  const optionName = `Size ${suffix}`
  const optionValue = `Large ${suffix}`
  const product = await seedProductWithVariants({
    name: `Orders detail product ${suffix}`,
    slug: "orders-detail-product",
    options: [{ name: optionName, values: [optionValue] }],
    variants: [
      { values: { [optionName]: optionValue }, price: 2500, stock: 10 },
    ],
  })
  const [variant] = await testDb
    .select({ id: productVariants.id })
    .from(productVariants)
    .where(eq(productVariants.productId, product.id))
  const order = await seedOrder({
    userId: await getSeededUserId(customer.email),
    checkoutEmail: customer.email,
    status: "processing",
    totalAmount: 5000,
  })
  await seedOrderItem(order.id, variant.id, { quantity: 2 })
  const processing = await seedOrderTimelineEvent(
    order.id,
    "processing",
    "Orders detail packing",
    new Date("2025-01-02T12:00:00Z")
  )
  const paid = await seedOrderTimelineEvent(
    order.id,
    "paid",
    "Orders detail payment",
    new Date("2025-01-01T12:00:00Z")
  )
  const staffNote = await seedOrderStaffNote(order.id)

  await signIn(page, customer)
  await page.goto("/orders")
  const summary = page.locator(`[data-order-id="${order.id}"]`)
  await expect(summary).toContainText(product.name)
  await expect(summary).toContainText("Processing")
  await expect(summary).toContainText("$50.00")
  await expect(summary.locator("time")).toHaveAttribute(
    "datetime",
    order.createdAt.toISOString()
  )
  await clickUntilHydrated(
    summary.locator(`a[href="/orders/${order.id}"]`),
    () => expect(page).toHaveURL(`/orders/${order.id}`)
  )

  await expect(
    page.getByRole("heading", {
      name: `Order #${order.id.slice(0, 8)}`,
      exact: true,
    })
  ).toBeVisible()
  const item = page.getByTestId("order-item").filter({ hasText: product.name })
  await expect(item).toContainText(`${optionName}: ${optionValue}`)
  await expect(item.getByRole("cell").nth(1)).toHaveText("2")
  await expect(item.getByRole("cell").nth(2)).toHaveText("$25.00")
  await expect(item.getByRole("cell").nth(3)).toHaveText("$50.00")
  await expect(page.getByTestId("order-total")).toHaveText("$50.00")

  const events = page
    .getByRole("list", { name: "Public order status history" })
    .getByTestId("order-timeline-event")
  await expect(events.nth(0)).toContainText(paid.note!)
  await expect(events.nth(1)).toContainText(processing.note!)
  await expect(page.getByRole("main")).not.toContainText(staffNote.content)

  const navigation = page.getByRole("main").getByRole("navigation", {
    name: "Account",
    exact: true,
  })
  await expect(navigation.locator("a[aria-current]")).toHaveAttribute(
    "href",
    "/orders"
  )
  for (const { name, path, heading } of [
    {
      name: "Settings",
      path: "/profile/settings",
      heading: "Account settings",
    },
    { name: "Profile", path: "/profile", heading: "Your profile" },
  ]) {
    await clickUntilHydrated(
      navigation.getByRole("link", { name, exact: true }),
      () => expect(page).toHaveURL(path)
    )
    await expect(
      page.getByRole("heading", { name: heading, exact: true })
    ).toBeVisible()
    await expect(navigation.locator("a[aria-current]")).toHaveAttribute(
      "href",
      path
    )
  }
})
