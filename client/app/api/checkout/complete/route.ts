import { NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { clearCart as clearCookieCart } from "@/features/cart/cookie";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const sessionId = searchParams.get("session_id");

  if (!sessionId) {
    return NextResponse.redirect(new URL("/checkout/success", origin));
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session.metadata?.userId && session.metadata?.source === "cart") {
      await clearCookieCart();
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
