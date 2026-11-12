import { test, expect } from "@playwright/test"
import { and, desc, eq, like } from "drizzle-orm"
import { verification } from "@repo/db/public/auth-schema"
import { orders } from "@repo/db/public/schema"
import {
  buildSignedCheckoutEvent,
  createTestCheckoutSession,
} from "../../utils/checkout"
import { createCustomerSession } from "../../utils/customer-session"
import { testDb } from "../../utils/db"
import { seedProduct } from "../../utils/seed-product"
import { getSeededUserId, seedUser } from "../../utils/seed-user"
import { uniqueNameSuffix, uniqueSuffix } from "../../utils/unique"

test("saves a paid checkout after its customer account has been deleted", async ({
  request,
  baseURL,
}) => {
  test.slow()

  const customer = await seedUser(request, {
    name: `DP ${uniqueNameSuffix()}`,
    email: "delivered@resend.dev",
  })
  const userId = await getSeededUserId(customer.email)
  const product = await seedProduct({
    name: `Delayed payment ${uniqueSuffix()}`,
  })
  const checkout = await createTestCheckoutSession({
    variantId: product.variant.id,
    productName: product.name,
    unitAmount: product.variant.price,
    quantity: 2,
    userId,
    source: "cart",
  })
  const customerSession = await createCustomerSession(baseURL!, customer)

  try {
    const deletionRequest = await customerSession.post(
      "/api/auth/delete-user",
      {
        data: {},
      }
    )
    expect(deletionRequest.ok()).toBe(true)
    expect(await deletionRequest.json()).toMatchObject({
      message: "Verification email sent",
    })

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

    const deletion = await customerSession.post("/api/auth/delete-user", {
      data: { token },
    })
    expect(deletion.ok()).toBe(true)
    expect(await deletion.json()).toMatchObject({
      success: true,
      message: "User deleted",
    })

    const { body, signature } = buildSignedCheckoutEvent({
      sessionId: checkout.id,
      customerEmail: customer.email,
      amountTotal: checkout.amount_total!,
      metadata: { userId, source: "cart" },
    })
    const response = await request.post("/api/webhooks/stripe", {
      data: body,
      headers: {
        "content-type": "application/json",
        "stripe-signature": signature,
      },
    })
    expect(response.ok()).toBe(true)

    await expect
      .poll(() =>
        testDb.query.orders.findFirst({
          where: eq(orders.stripeSessionId, checkout.id),
          with: { items: true },
        })
      )
      .toMatchObject({
        userId: null,
        checkoutEmail: customer.email,
        totalAmount: checkout.amount_total,
        status: "paid",
        items: [
          {
            variantId: product.variant.id,
            quantity: 2,
            priceAtPurchase: product.variant.price,
          },
        ],
      })
  } finally {
    await customerSession.dispose()
  }
})
