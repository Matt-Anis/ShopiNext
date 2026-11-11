import type Stripe from "stripe";
import { clearCart } from "@/features/cart/queries";
import { getOrCreateCheckoutOrder } from "@/features/orders/get-or-create-checkout-order";
import { markOrderConfirmationEmailSent } from "@/features/orders/queries";
import { sendOrderConfirmationEmail } from "@/features/orders/send-confirmation-email";

export async function processPaidCheckout(session: Stripe.Checkout.Session) {
  const { order, created } = await getOrCreateCheckoutOrder(session);

  if (created && order.userId && session.metadata?.source === "cart") {
    await clearCart(order.userId);
  }

  if (order.confirmationEmailSentAt) return;

  try {
    await sendOrderConfirmationEmail(order);
    await markOrderConfirmationEmailSent(order.id);
  } catch (error) {
    throw new Error(
      `Failed to confirm payment by email for order ${order.id} (Stripe session ${order.stripeSessionId})`,
      { cause: error },
    );
  }
}
