import { test, expect } from "@playwright/test"
import { and, desc, eq, like } from "drizzle-orm"
import { account, user, verification } from "@repo/db/public/auth-schema"
import { cart, cartItems, orders } from "@repo/db/public/schema"
import { signIn } from "../../utils/auth"
import {
  createCustomerSession,
  readCustomerSession,
  snapshotCustomerSession,
} from "../../utils/customer-session"
import { testDb } from "../../utils/db"
import { clickUntilHydrated } from "../../utils/interaction"
import {
  seedOrder,
  seedOrderItem,
  seedOrderTimelineEvent,
} from "../../utils/seed-order"
import { seedProduct } from "../../utils/seed-product"
import { getSeededUserId, seedUser } from "../../utils/seed-user"
import { uniqueNameSuffix, uniqueSuffix } from "../../utils/unique"

test("requires confirmation and verification, deletes account data, and preserves orders", async ({
  page,
  request,
  baseURL,
}) => {
  test.slow()

  const customer = await seedUser(request, {
    name: `AD ${uniqueNameSuffix()}`,
    email: "delivered@resend.dev",
  })
  const userId = await getSeededUserId(customer.email)
  const product = await seedProduct({
    name: `Deletion product ${uniqueSuffix()}`,
  })
  const [savedCart] = await testDb.insert(cart).values({ userId }).returning()
  await testDb.insert(cartItems).values({
    cartId: savedCart.id,
    variantId: product.variant.id,
    quantity: 1,
  })
  const order = await seedOrder({ userId, checkoutEmail: customer.email })
  const item = await seedOrderItem(order.id, product.variant.id, {
    quantity: 2,
  })
  const event = await seedOrderTimelineEvent(
    order.id,
    "paid",
    "Deletion retained order",
    new Date()
  )

  await signIn(page, customer)
  const originalSession = await snapshotCustomerSession(page, baseURL!)
  const otherSession = await createCustomerSession(baseURL!, customer)

  try {
    let deletionRequests = 0
    page.on("request", (outgoing) => {
      if (
        outgoing.method() === "POST" &&
        new URL(outgoing.url()).pathname === "/api/auth/delete-user"
      ) {
        deletionRequests += 1
      }
    })

    await page.goto("/profile/settings")
    const deleteButton = page.getByRole("button", {
      name: "Delete account",
      exact: true,
    })
    const dialog = page.getByRole("alertdialog", {
      name: "Send account deletion email?",
    })
    await clickUntilHydrated(deleteButton, () => expect(dialog).toBeVisible())
    await clickUntilHydrated(
      dialog.getByRole("button", { name: "Cancel", exact: true }),
      () => expect(dialog).toBeHidden()
    )
    expect(deletionRequests).toBe(0)

    await page.goto(`/delete-account?token=invalid-${uniqueSuffix()}`)
    await clickUntilHydrated(
      page.getByRole("button", { name: "Delete my account", exact: true }),
      () =>
        expect(page.getByRole("alert")).toContainText("This link is invalid")
    )
    await expect
      .poll(() => readCustomerSession(originalSession))
      .toMatchObject({ user: { id: userId } })

    await page.goto("/profile/settings")
    await clickUntilHydrated(deleteButton, () => expect(dialog).toBeVisible())
    await clickUntilHydrated(
      dialog.getByRole("button", { name: "Send deletion email", exact: true }),
      () =>
        expect(
          page.getByText("Deletion email sent", { exact: true })
        ).toBeVisible()
    )
    await expect
      .poll(() => readCustomerSession(originalSession))
      .toMatchObject({ user: { id: userId } })
    await expect
      .poll(() => readCustomerSession(otherSession))
      .toMatchObject({ user: { id: userId } })

    let token = ""
    await expect
      .poll(async () => {
        const row = await testDb.query.verification.findFirst({
          where: and(
            eq(verification.value, userId),
            like(verification.identifier, "delete-account-%")
          ),
          orderBy: desc(verification.createdAt),
        })
        token = row?.identifier.replace("delete-account-", "") ?? ""
        return token
      })
      .not.toBe("")

    await page.goto(`/delete-account?token=${encodeURIComponent(token)}`)
    await clickUntilHydrated(
      page.getByRole("button", { name: "Delete my account", exact: true }),
      () => expect(page).toHaveURL("/")
    )
    await expect(page.getByTestId("signin-nav-button")).toBeVisible()
    await expect(page.getByTestId("cart-badge")).toBeHidden()
    await expect.poll(() => readCustomerSession(originalSession)).toBeNull()
    await expect.poll(() => readCustomerSession(otherSession)).toBeNull()
    await expect
      .poll(() => testDb.select().from(user).where(eq(user.id, userId)))
      .toEqual([])
    await expect
      .poll(() =>
        testDb.select().from(account).where(eq(account.userId, userId))
      )
      .toEqual([])
    await expect
      .poll(() => testDb.select().from(cart).where(eq(cart.id, savedCart.id)))
      .toEqual([])
    await expect
      .poll(() =>
        testDb
          .select()
          .from(cartItems)
          .where(eq(cartItems.cartId, savedCart.id))
      )
      .toEqual([])
    await expect
      .poll(() =>
        testDb.query.orders.findFirst({
          where: eq(orders.id, order.id),
          with: { items: true, timelineEvents: true },
        })
      )
      .toEqual({
        ...order,
        userId: null,
        items: [item],
        timelineEvents: [event],
      })
  } finally {
    await originalSession.dispose()
    await otherSession.dispose()
  }
})
