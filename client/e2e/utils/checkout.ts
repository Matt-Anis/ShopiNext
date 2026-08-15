import { testStripe } from "./stripe";

type CreateTestSessionParams = {
  productId: string;
  productName?: string;
  unitAmount?: number;
  quantity?: number;
  userId?: string;
  source: "cart" | "buy-now";
};

// Creates a real Stripe test-mode Checkout Session, same shape as
// createCheckoutSession in features/checkout/actions.ts, so the webhook
// handler's stripe.checkout.sessions.listLineItems call has something
// genuine to resolve against.
export async function createTestCheckoutSession({
  productId,
  productName = "Test Product",
  unitAmount = 1000,
  quantity = 1,
  userId,
  source,
}: CreateTestSessionParams) {
  return testStripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        quantity,
        price_data: {
          currency: "usd",
          unit_amount: unitAmount,
          product_data: { name: productName, metadata: { productId } },
        },
      },
    ],
    metadata: {
      ...(userId ? { userId } : {}),
      source,
    },
    success_url:
      "http://localhost:3000/api/checkout/complete?session_id={CHECKOUT_SESSION_ID}",
    cancel_url:
      "http://localhost:3000/checkout/cancel?session_id={CHECKOUT_SESSION_ID}",
  });
}

type BuildCompletedEventParams = {
  sessionId: string;
  customerEmail: string;
  amountTotal: number;
  metadata: Record<string, string>;
  paymentStatus?: "paid" | "unpaid";
  eventType?: string;
};

// Builds a checkout.session.completed style event body and signs it with
// the same webhook secret the running dev server verifies against, so we
// can exercise the real webhook handler without needing an actual browser
// payment or a live `stripe listen` forwarder.
export function buildSignedCheckoutEvent({
  sessionId,
  customerEmail,
  amountTotal,
  metadata,
  paymentStatus = "paid",
  eventType = "checkout.session.completed",
}: BuildCompletedEventParams) {
  const payload = {
    id: `evt_test_${sessionId}`,
    type: eventType,
    data: {
      object: {
        id: sessionId,
        payment_status: paymentStatus,
        customer_details: { email: customerEmail },
        amount_total: amountTotal,
        metadata,
      },
    },
  };

  const body = JSON.stringify(payload);
  const secret = process.env.STRIPE_WEBHOOK_SECRET!;
  const signature = testStripe.webhooks.generateTestHeaderString({
    payload: body,
    secret,
  });

  return { body, signature };
}
