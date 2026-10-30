import { test, expect } from "@playwright/test"
import { eq } from "drizzle-orm"
import { orders, orderTimelineEvents } from "@repo/db/public/schema"
import { testDb } from "../../utils/db"
import { seedAdmin } from "../../utils/seed-user"
import { seedOrder, seedOrderTimelineEvent } from "../../utils/seed-order"
import { signIn } from "../../utils/auth"
import { uniqueSuffix } from "../../utils/unique"

let admin: Awaited<ReturnType<typeof seedAdmin>>

test.beforeEach(async () => {
  admin = await seedAdmin()
})

test.describe("Order status & timeline events", () => {
  test("updates status with a timeline note and displays in timeline history", async ({
    page,
  }) => {
    const order = await seedOrder({
      status: "paid",
      checkoutEmail: `status.${uniqueSuffix()}@example.com`,
    })

    await seedOrderTimelineEvent(order.id, "paid", "Initial payment received")

    await signIn(page, admin)
    await page.goto(`/orders/${order.id}`)

    const timeline = page.locator("#order-timeline")
    await expect(timeline).toContainText("Status set to")
    await expect(timeline).toContainText("Paid")
    await expect(timeline).toContainText("Initial payment received")

    await page.getByRole("button", { name: "Update Status" }).click()
    const dialog = page.getByRole("dialog")
    await expect(dialog).toBeVisible()

    await dialog.getByRole("button", { name: "Shipped" }).click()
    const noteText = `Package dispatched via courier ${uniqueSuffix()}`
    await dialog.getByLabel("Timeline Note (Optional)").fill(noteText)
    await dialog.getByRole("button", { name: "Save Status" }).click()

    await expect(dialog).toBeHidden()

    await expect(timeline).toContainText("Status set to")
    await expect(timeline).toContainText("Shipped")
    await expect(timeline).toContainText(noteText)

    const [dbOrder] = await testDb
      .select()
      .from(orders)
      .where(eq(orders.id, order.id))
    expect(dbOrder?.status).toBe("shipped")

    const events = await testDb
      .select()
      .from(orderTimelineEvents)
      .where(eq(orderTimelineEvents.orderId, order.id))
    expect(events.some((e) => e.status === "shipped" && e.note === noteText)).toBe(
      true
    )
  })

  test("updates status without an optional timeline note", async ({ page }) => {
    const order = await seedOrder({
      status: "processing",
    })

    await signIn(page, admin)
    await page.goto(`/orders/${order.id}`)

    await page.getByRole("button", { name: "Update Status" }).click()
    const dialog = page.getByRole("dialog")
    await expect(dialog).toBeVisible()

    await dialog.getByRole("button", { name: "Delivered" }).click()
    await dialog.getByRole("button", { name: "Save Status" }).click()

    await expect(dialog).toBeHidden()

    const timeline = page.locator("#order-timeline")
    await expect(timeline).toContainText("Status set to")
    await expect(timeline).toContainText("Delivered")

    const [dbOrder] = await testDb
      .select()
      .from(orders)
      .where(eq(orders.id, order.id))
    expect(dbOrder?.status).toBe("delivered")
  })

  test("toggles archive and restore from the order header", async ({ page }) => {
    const order = await seedOrder({
      status: "paid",
    })

    await signIn(page, admin)
    await page.goto(`/orders/${order.id}`)

    await page.getByRole("button", { name: "Archive" }).click()

    await expect(page.getByRole("button", { name: "Unarchive" })).toBeVisible()
    await expect(
      page.locator("[data-slot='badge']").getByText("Archived")
    ).toBeVisible()

    await expect
      .poll(async () => {
        const [dbOrder] = await testDb
          .select()
          .from(orders)
          .where(eq(orders.id, order.id))
        return dbOrder?.archivedAt
      })
      .not.toBeNull()

    await page.getByRole("button", { name: "Unarchive" }).click()
    await expect(page.getByRole("button", { name: "Archive" })).toBeVisible()

    await expect
      .poll(async () => {
        const [dbOrder] = await testDb
          .select()
          .from(orders)
          .where(eq(orders.id, order.id))
        return dbOrder?.archivedAt
      })
      .toBeNull()
  })
})
