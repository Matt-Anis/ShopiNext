"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import * as cartCookie from "@/features/cart/cookie";
import * as cartDb from "@/features/cart/queries";
import type { Product } from "@/features/products/queries";

export type CartItem = {
  quantity: number;
  product: Product;
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

  return cart.items.map((item) => ({
    quantity: item.quantity,
    product: item.product,
  }));
};

export const addCartItem = async (productId: string, quantity = 1) => {
  const userId = await getUserId();

  if (userId) {
    await cartDb.createCartItem(userId, productId, quantity);
  } else {
    await cartCookie.addCartItem(productId, quantity);
  }

  return getCart();
};

export const updateCartItemQuantity = async (
  productId: string,
  quantity: number,
) => {
  const userId = await getUserId();

  if (userId) {
    await cartDb.updateCartItemQuantity(userId, productId, quantity);
  } else {
    await cartCookie.updateCartItemQuantity(productId, quantity);
  }

  return getCart();
};

export const deleteCartItem = async (productId: string) => {
  const userId = await getUserId();

  if (userId) {
    await cartDb.deleteCartItem(userId, productId);
  } else {
    await cartCookie.deleteCartItem(productId);
  }

  return getCart();
};
