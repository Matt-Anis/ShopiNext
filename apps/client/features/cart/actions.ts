"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import * as cartCookie from "@/features/cart/cookie";
import * as cartDb from "@/features/cart/queries";

export type CartItemVariant = {
  id: string;
  price: number;
  stock: number;
  optionLabel: string;
  product: {
    id: string;
    name: string;
    slug: string;
    image: { url: string; altText: string | null } | null;
  };
};

export type CartItem = {
  quantity: number;
  variant: CartItemVariant;
};

const getUserId = async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user.id;
};

export const getCart = async (): Promise<CartItem[]> => {
  const userId = await getUserId();

  if (!userId) {
    return cartCookie.getCartFromCookies();
  }

  const cart = await cartDb.getCartFromDb(userId);
  if (!cart) return [];

  return cart.items.map(cartDb.toCartItem);
};

export const addCartItem = async (variantId: string, quantity = 1) => {
  const userId = await getUserId();

  if (userId) {
    await cartDb.createCartItem(userId, variantId, quantity);
  } else {
    await cartCookie.addCartItem(variantId, quantity);
  }

  return getCart();
};

export const updateCartItemQuantity = async (
  variantId: string,
  quantity: number,
) => {
  const userId = await getUserId();

  if (userId) {
    await cartDb.updateCartItemQuantity(userId, variantId, quantity);
  } else {
    await cartCookie.updateCartItemQuantity(variantId, quantity);
  }

  return getCart();
};

export const deleteCartItem = async (variantId: string) => {
  const userId = await getUserId();

  if (userId) {
    await cartDb.deleteCartItem(userId, variantId);
  } else {
    await cartCookie.deleteCartItem(variantId);
  }

  return getCart();
};
