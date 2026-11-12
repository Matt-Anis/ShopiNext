import { randomUUID } from "node:crypto"
import { test, expect } from "@playwright/test"
import { signIn } from "../../utils/auth"
import { seedOrder } from "../../utils/seed-order"
import { seedUser, getSeededUserId } from "../../utils/seed-user"
import { uniqueNameSuffix } from "../../utils/unique"

test("requires sign-in and hides foreign, guest, missing, and invalid orders", async ({
  page,
  request,
}) => {
  test.slow()

  const customer = await seedUser(request, {
    name: `OA ${uniqueNameSuffix()}`,
    email: "orders-access@example.com",
  })
  const otherCustomer = await seedUser(request, {
    name: `OX ${uniqueNameSuffix()}`,
    email: "orders-access-other@example.com",
  })
  const ownOrder = await seedOrder({
    userId: await getSeededUserId(customer.email),
    checkoutEmail: customer.email,
  })
  const foreignOrder = await seedOrder({
    userId: await getSeededUserId(otherCustomer.email),
    checkoutEmail: otherCustomer.email,
  })
  const guestOrder = await seedOrder({ checkoutEmail: customer.email })

  await page.goto("/orders")
  await page.waitForURL(/\/login$/)
  await expect(page.getByTestId("login-form")).toBeVisible()
  await page.goto(`/orders/${ownOrder.id}`)
  await page.waitForURL(/\/login$/)

  await signIn(page, customer)
  await page.goto("/orders")
  await expect(page.locator(`[data-order-id="${ownOrder.id}"]`)).toBeVisible()
  await expect(
    page.locator(`[data-order-id="${foreignOrder.id}"]`)
  ).toBeHidden()
  await expect(page.locator(`[data-order-id="${guestOrder.id}"]`)).toBeHidden()

  for (const id of [
    foreignOrder.id,
    guestOrder.id,
    randomUUID(),
    "not-a-uuid",
  ]) {
    await page.goto(`/orders/${id}`)
    await expect(
      page.getByRole("heading", { name: "Order not found", exact: true })
    ).toBeVisible()
    await expect(page.getByRole("main")).not.toContainText(otherCustomer.email)
  }
})
