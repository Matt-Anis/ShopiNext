"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { getCart } from "@/features/cart/actions";
import { getVariantsByIds, optionLabelFor } from "@/features/products/queries";

type LineItemInput = {
  variantId: string;
  productName: string;
  optionLabel: string;
  price: number;
  quantity: number;
};

type CheckoutSource = "cart" | "buy-now";

const createCheckoutSession = async (
  items: LineItemInput[],
  source: CheckoutSource,
) => {
  if (items.length === 0) {
    throw new Error("Cannot checkout with no items");
  }

  const variants = await getVariantsByIds(items.map((item) => item.variantId));
  const variantById = new Map(variants.map((variant) => [variant.id, variant]));

  for (const item of items) {
    const variant = variantById.get(item.variantId);
    const available = variant
      ? Math.min(variant.stock, variant.maxPerOrder)
      : 0;

    if (item.quantity > available) {
      throw new Error(
        `${item.productName} is no longer available in the requested quantity`,
      );
    }
  }

  const session = await auth.api.getSession({ headers: await headers() });
  const user = session?.user;

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: items.map((item) => ({
      quantity: item.quantity,
      price_data: {
        currency: "usd",
        unit_amount: item.price,
        product_data: {
          name: item.productName,
          description: item.optionLabel || undefined,
          metadata: { variantId: item.variantId },
        },
      },
    })),
    customer_email: user?.email,
    metadata: {
      ...(user ? { userId: user.id } : {}),
      source,
    },
    success_url: `${process.env.BETTER_AUTH_URL}/api/checkout/complete?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.BETTER_AUTH_URL}/checkout/cancel?session_id={CHECKOUT_SESSION_ID}`,
  });

  if (!checkoutSession.url) {
    throw new Error("Stripe did not return a checkout URL");
  }

  redirect(checkoutSession.url);
};

export const checkoutNow = async (
  variantId: string,
  quantity: number,
) => {
  const [variant] = await getVariantsByIds([variantId]);

  if (!variant) {
    throw new Error("Product not found");
  }

  await createCheckoutSession(
    [
      {
        variantId: variant.id,
        productName: variant.product.name,
        optionLabel: optionLabelFor(variant.variantOptionValues),
        price: variant.price,
        quantity,
      },
    ],
    "buy-now",
  );
};

export const checkoutCart = async () => {
  const cart = await getCart();

  await createCheckoutSession(
    cart.map((item) => ({
      variantId: item.variant.id,
      productName: item.variant.product.name,
      optionLabel: item.variant.optionLabel,
      price: item.variant.price,
      quantity: item.quantity,
    })),
    "cart",
  );
};
