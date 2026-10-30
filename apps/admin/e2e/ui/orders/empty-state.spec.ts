import { test, expect } from "@playwright/test"
import { seedAdmin } from "../../utils/seed-user"
import { signIn } from "../../utils/auth"

test("shows the empty state when there are no active orders", async ({
  page,
}) => {
  const admin = await seedAdmin()
  await signIn(page, admin)
  await page.goto("/orders")

  await expect(page.getByTestId("orders-empty-state")).toBeVisible()
  await expect(page.getByText("No orders yet")).toBeVisible()
})

test("shows the empty state when there are no archived orders", async ({
  page,
}) => {
  const admin = await seedAdmin()
  await signIn(page, admin)
  await page.goto("/orders/archived")

  await expect(page.getByTestId("archived-orders-empty-state")).toBeVisible()
  await expect(page.getByText("No archived orders")).toBeVisible()
})
