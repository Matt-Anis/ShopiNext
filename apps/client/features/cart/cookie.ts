import { cookies } from "next/headers";
import { getVariantsByIds } from "@/features/products/queries";
import { toCartItem } from "@/features/cart/queries";
import type { CartItem } from "@/features/cart/actions";

export const CART_COOKIE_NAME = "cart";

export type CookieCartItem = {
  variantId: string;
  quantity: number;
};

const parseCookie = (raw: string | undefined): CookieCartItem[] => {
  if (!raw) return [];

  try {
    return JSON.parse(raw) as CookieCartItem[];
  } catch {
    return [];
  }
};

const setCookie = async (items: CookieCartItem[]) => {
  const store = await cookies();
  store.set(CART_COOKIE_NAME, JSON.stringify(items));
};

const pruneStaleItems = async (items: CookieCartItem[]) => {
  if (items.length === 0) return items;

  const variants = await getVariantsByIds(items.map((item) => item.variantId));
  const validIds = new Set(variants.map((variant) => variant.id));

  return items.filter((item) => validIds.has(item.variantId));
};

const setItemQuantity = (
  items: CookieCartItem[],
  variantId: string,
  quantity: number,
): CookieCartItem[] => {
  if (quantity <= 0) {
    return items.filter((item) => item.variantId !== variantId);
  }

  const existing = items.find((item) => item.variantId === variantId);
  if (existing) {
    existing.quantity = quantity;
    return items;
  }

  return [...items, { variantId, quantity }];
};

export const addCartItem = async (variantId: string, quantity = 1) => {
  const store = await cookies();
  const items = await pruneStaleItems(
    parseCookie(store.get(CART_COOKIE_NAME)?.value),
  );

  const [variant] = await getVariantsByIds([variantId]);
  if (!variant) return;

  const existing = items.find((item) => item.variantId === variantId);
  const nextQuantity = Math.min(
    (existing?.quantity ?? 0) + quantity,
    variant.stock,
  );

  await setCookie(setItemQuantity(items, variantId, nextQuantity));
};

export const clearCart = async () => {
  const store = await cookies();
  store.delete(CART_COOKIE_NAME);
};

export const deleteCartItem = async (variantId: string) => {
  const store = await cookies();
  const items = await pruneStaleItems(
    parseCookie(store.get(CART_COOKIE_NAME)?.value),
  );

  await setCookie(items.filter((item) => item.variantId !== variantId));
};

export const updateCartItemQuantity = async (
  variantId: string,
  quantity: number,
) => {
  const store = await cookies();
  const items = await pruneStaleItems(
    parseCookie(store.get(CART_COOKIE_NAME)?.value),
  );

  const [variant] = await getVariantsByIds([variantId]);
  if (!variant) return;

  await setCookie(
    setItemQuantity(items, variantId, Math.min(quantity, variant.stock)),
  );
};

export const getCartFromCookies = async (): Promise<CartItem[]> => {
  const store = await cookies();
  const items = parseCookie(store.get(CART_COOKIE_NAME)?.value);

  if (items.length === 0) return [];

  const variants = await getVariantsByIds(items.map((item) => item.variantId));
  const variantById = new Map(variants.map((variant) => [variant.id, variant]));

  return items
    .map((item) => {
      const variant = variantById.get(item.variantId);
      return variant ? toCartItem({ quantity: item.quantity, variant }) : null;
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);
};
