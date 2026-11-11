import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import {
  createOrder,
  getOrderByStripeSessionId,
} from "@/features/orders/queries";

export async function getOrCreateCheckoutOrder(
  session: Stripe.Checkout.Session,
) {
  const existingOrder = await getOrderByStripeSessionId(session.id);
  if (existingOrder) {
    return { order: existingOrder, created: false };
  }

  const checkoutEmail = session.customer_details?.email;
  if (!checkoutEmail) {
    throw new Error(`Session ${session.id} completed with no customer email`);
  }

  if (session.amount_total == null) {
    throw new Error(`Session ${session.id} completed with no amount_total`);
  }

  const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
    expand: ["data.price.product"],
  });

  const items = lineItems.data.map((item) => {
    const product = item.price?.product as Stripe.Product | undefined;
    const variantId = product?.metadata.variantId;

    if (
      !variantId ||
      item.quantity == null ||
      item.price?.unit_amount == null
    ) {
      throw new Error(
        `Malformed line item on session ${session.id}: missing variantId, quantity, or unit_amount`,
      );
    }

    return {
      variantId,
      quantity: item.quantity,
      priceAtPurchase: item.price.unit_amount,
    };
  });

  const createdOrder = await createOrder({
    stripeSessionId: session.id,
    userId: session.metadata?.userId ?? null,
    checkoutEmail,
    totalAmount: session.amount_total,
    status: "paid",
    items,
  });

  const order = createdOrder ?? (await getOrderByStripeSessionId(session.id));
  if (!order) {
    throw new Error(`No saved order found for session ${session.id}`);
  }

  return { order, created: createdOrder !== null };
}
