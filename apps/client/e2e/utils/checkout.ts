import { testStripe } from "./stripe";

type CreateTestSessionParams = {
  variantId: string;
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
  variantId,
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
          product_data: { name: productName, metadata: { variantId } },
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
  paymentIntent?: string;
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
  paymentIntent,
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
        ...(paymentIntent ? { payment_intent: paymentIntent } : {}),
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

// A real, immediately-confirmed test-mode PaymentIntent, so a test can
// verify the webhook handler actually issues a Stripe refund on an
// oversold order rather than just checking that no order was created.
export async function createConfirmedTestPaymentIntent(amount: number) {
  return testStripe.paymentIntents.create({
    amount,
    currency: "usd",
    payment_method: "pm_card_visa",
    confirm: true,
    automatic_payment_methods: { enabled: true, allow_redirects: "never" },
  });
}
