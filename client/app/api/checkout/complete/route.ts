import { NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { clearCart as clearCookieCart } from "@/features/cart/cookie";
import { clearCart as clearDbCart } from "@/features/cart/queries";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const sessionId = searchParams.get("session_id");

  if (!sessionId) {
    return NextResponse.redirect(new URL("/checkout/success", origin));
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.metadata?.source === "cart") {
      if (session.metadata.userId) {
        // Redundant with the webhook's own DB cart clear. The webhook is
        // the guaranteed path, but its timing is independent of this
        // redirect, so without this a customer can land on the success
        // page before the webhook has run and still see their old cart.
        // A delete is naturally idempotent, so doing it in both places
        // is safe.
        await clearDbCart(session.metadata.userId);
      } else {
        await clearCookieCart();
      }
    }
  } catch (error) {
    if (!(error instanceof Stripe.errors.StripeInvalidRequestError)) {
      console.error("Failed to retrieve checkout session", error);
      return NextResponse.json(
        { error: "Something went wrong" },
        { status: 500 },
      );
    }
  }

  return NextResponse.redirect(
    new URL(`/checkout/success?session_id=${sessionId}`, origin),
  );
}
