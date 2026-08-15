"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { getCart } from "@/features/cart/actions";
import { getProductsByIds, type Product } from "@/features/products/queries";

type LineItemInput = {
  product: Product;
  quantity: number;
};

const createCheckoutSession = async (items: LineItemInput[]) => {
  if (items.length === 0) {
    throw new Error("Cannot checkout with no items");
  }

  const session = await auth.api.getSession({ headers: await headers() });
  const user = session?.user;

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: items.map(({ product, quantity }) => ({
      quantity,
      price_data: {
        currency: "usd",
        unit_amount: product.price,
        product_data: {
          name: product.name,
          metadata: { productId: product.id },
        },
      },
    })),
    customer_email: user?.email,
    metadata: user ? { userId: user.id } : undefined,
    success_url: `${process.env.BETTER_AUTH_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.BETTER_AUTH_URL}/checkout/cancel`,
  });

  if (!checkoutSession.url) {
    throw new Error("Stripe did not return a checkout URL");
  }

  redirect(checkoutSession.url);
};

export const checkoutNow = async (productId: string, quantity = 1) => {
  const [product] = await getProductsByIds([productId]);

  if (!product) {
    throw new Error("Product not found");
  }

  await createCheckoutSession([{ product, quantity }]);
};

export const checkoutCart = async () => {
  const cart = await getCart();

  await createCheckoutSession(
    cart.map((item) => ({ product: item.product, quantity: item.quantity })),
  );
};
