import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { createOrder } from "@/features/orders/queries";
import { clearCart } from "@/features/cart/queries";

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
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
      expand: ["data.price.product"],
    });

    const items = lineItems.data.map((item) => {
      const product = item.price?.product as Stripe.Product | undefined;
      const productId = product?.metadata.productId;

      if (
        !productId ||
        item.quantity == null ||
        item.price?.unit_amount == null
      ) {
        throw new Error(
          `Malformed line item on session ${session.id}: missing productId, quantity, or unit_amount`,
        );
      }

      return {
        productId,
        quantity: item.quantity,
        priceAtPurchase: item.price.unit_amount,
      };
    });

    const checkoutEmail = session.customer_details?.email;
    if (!checkoutEmail) {
      throw new Error(`Session ${session.id} completed with no customer email`);
    }

    if (session.amount_total == null) {
      throw new Error(`Session ${session.id} completed with no amount_total`);
    }

    const userId = session.metadata?.userId ?? null;

    const order = await createOrder({
      stripeSessionId: session.id,
      userId,
      checkoutEmail,
      totalAmount: session.amount_total,
      items,
    });

    if (order && userId && session.metadata?.source === "cart") {
      await clearCart(userId);
    }
  } catch (error) {
    console.error("Failed to process checkout.session.completed", error);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
