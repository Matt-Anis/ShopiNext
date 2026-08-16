import { test, expect } from "@playwright/test";
import { eq } from "drizzle-orm";
import { testDb } from "../../utils/db";
import { orders, orderItems, cart, cartItems } from "@/db/schema";
import {
  resetAuthTables,
  resetCartTables,
  resetOrderTables,
} from "../../utils/db-reset";
import { seedUser, DEFAULT_TEST_USER } from "../../utils/seed-user";
import { seedProduct } from "../../utils/seed-product";
import {
  createTestCheckoutSession,
  buildSignedCheckoutEvent,
} from "../../utils/checkout";

test.beforeEach(async () => {
  await resetOrderTables();
  await resetCartTables();
  await resetAuthTables();
});

test.describe("POST /api/webhooks/stripe", () => {
  test("rejects a request with no signature header", async ({ request }) => {
    const response = await request.post("/api/webhooks/stripe", {
      data: JSON.stringify({ type: "checkout.session.completed" }),
      headers: { "content-type": "application/json" },
    });

    expect(response.status()).toBe(400);
  });

  test("rejects a request with a bad signature", async ({ request }) => {
    const response = await request.post("/api/webhooks/stripe", {
      data: JSON.stringify({ type: "checkout.session.completed" }),
      headers: {
        "content-type": "application/json",
        "stripe-signature": "t=1,v1=not-a-real-signature",
      },
    });

    expect(response.status()).toBe(400);
  });

  test("creates an order and order_items for a valid signed event", async ({
    request,
  }) => {
    const product = await seedProduct();
    const session = await createTestCheckoutSession({
      productId: product.id,
      productName: product.name,
      unitAmount: product.price,
      source: "cart",
    });

    const { body, signature } = buildSignedCheckoutEvent({
      sessionId: session.id,
      customerEmail: "guest@example.com",
      amountTotal: session.amount_total!,
      metadata: { source: "cart" },
    });

    const response = await request.post("/api/webhooks/stripe", {
      data: body,
      headers: {
        "content-type": "application/json",
        "stripe-signature": signature,
      },
    });

    expect(response.ok()).toBe(true);

    const [order] = await testDb
      .select()
      .from(orders)
      .where(eq(orders.stripeSessionId, session.id));

    expect(order).toBeTruthy();
    expect(order.userId).toBeNull();
    expect(order.checkoutEmail).toBe("guest@example.com");
    expect(order.totalAmount).toBe(session.amount_total);

    const items = await testDb
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, order.id));

    expect(items).toHaveLength(1);
    expect(items[0].productId).toBe(product.id);
    expect(items[0].priceAtPurchase).toBe(product.price);
  });

  test("is idempotent for a redelivered event", async ({ request }) => {
    const product = await seedProduct();
    const session = await createTestCheckoutSession({
      productId: product.id,
      unitAmount: product.price,
      source: "cart",
    });

    const { body, signature } = buildSignedCheckoutEvent({
      sessionId: session.id,
      customerEmail: "guest@example.com",
      amountTotal: session.amount_total!,
      metadata: { source: "cart" },
    });

    for (let i = 0; i < 2; i++) {
      const response = await request.post("/api/webhooks/stripe", {
        data: body,
        headers: {
          "content-type": "application/json",
          "stripe-signature": signature,
        },
      });
      expect(response.ok()).toBe(true);
    }

    const matches = await testDb
      .select()
      .from(orders)
      .where(eq(orders.stripeSessionId, session.id));

    expect(matches).toHaveLength(1);
  });

  test("ignores a session whose payment_status is not paid", async ({
    request,
  }) => {
    const product = await seedProduct();
    const session = await createTestCheckoutSession({
      productId: product.id,
      unitAmount: product.price,
      source: "cart",
    });

    const { body, signature } = buildSignedCheckoutEvent({
      sessionId: session.id,
      customerEmail: "guest@example.com",
      amountTotal: session.amount_total!,
      metadata: { source: "cart" },
      paymentStatus: "unpaid",
    });

    const response = await request.post("/api/webhooks/stripe", {
      data: body,
      headers: {
        "content-type": "application/json",
        "stripe-signature": signature,
      },
    });

    expect(response.ok()).toBe(true);

    const matches = await testDb
      .select()
      .from(orders)
      .where(eq(orders.stripeSessionId, session.id));

    expect(matches).toHaveLength(0);
  });

  test("clears the DB cart for a logged in cart checkout, not for buy-now", async ({
    request,
  }) => {
    const credentials = await seedUser(request);
    const [seededUser] = await testDb.query.user.findMany({
      where: (fields, { eq }) => eq(fields.email, credentials.email),
    });
    const product = await seedProduct();

    const [seededCart] = await testDb
      .insert(cart)
      .values({ userId: seededUser.id })
      .returning();
    await testDb
      .insert(cartItems)
      .values({ cartId: seededCart.id, productId: product.id, quantity: 2 });

    const session = await createTestCheckoutSession({
      productId: product.id,
      unitAmount: product.price,
      userId: seededUser.id,
      source: "buy-now",
    });
    const { body, signature } = buildSignedCheckoutEvent({
      sessionId: session.id,
      customerEmail: DEFAULT_TEST_USER.email,
      amountTotal: session.amount_total!,
      metadata: { userId: seededUser.id, source: "buy-now" },
    });

    await request.post("/api/webhooks/stripe", {
      data: body,
      headers: {
        "content-type": "application/json",
        "stripe-signature": signature,
      },
    });

    const remainingAfterBuyNow = await testDb
      .select()
      .from(cartItems)
      .where(eq(cartItems.cartId, seededCart.id));
    expect(remainingAfterBuyNow).toHaveLength(1);

    const cartSession = await createTestCheckoutSession({
      productId: product.id,
      unitAmount: product.price,
      userId: seededUser.id,
      source: "cart",
    });
    const cartEvent = buildSignedCheckoutEvent({
      sessionId: cartSession.id,
      customerEmail: DEFAULT_TEST_USER.email,
      amountTotal: cartSession.amount_total!,
      metadata: { userId: seededUser.id, source: "cart" },
    });

    await request.post("/api/webhooks/stripe", {
      data: cartEvent.body,
      headers: {
        "content-type": "application/json",
        "stripe-signature": cartEvent.signature,
      },
    });

    const remainingAfterCart = await testDb
      .select()
      .from(cartItems)
      .where(eq(cartItems.cartId, seededCart.id));
    expect(remainingAfterCart).toHaveLength(0);
  });
});
