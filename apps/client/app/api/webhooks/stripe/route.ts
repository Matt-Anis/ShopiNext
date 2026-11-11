import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { OutOfStockError } from "@/features/orders/queries";
import { processPaidCheckout } from "@/features/orders/process-paid-checkout";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = (await headers()).get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object;

  if (session.payment_status !== "paid") {
    return NextResponse.json({ received: true });
  }

  try {
    await processPaidCheckout(session);
  } catch (error) {
    if (error instanceof OutOfStockError) {
      if (typeof session.payment_intent === "string") {
        await stripe.refunds.create({ payment_intent: session.payment_intent });
      }
      console.error(
        `Refunded session ${session.id}: variant ${error.variantId} sold out before the order could be created`,
      );
      return NextResponse.json({ received: true });
    }

    console.error(
      `Failed to process checkout.session.completed for session ${session.id}`,
      error,
    );
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
