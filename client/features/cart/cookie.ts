import { cookies } from "next/headers";
import { getProductsByIds } from "@/features/products/queries";

export const CART_COOKIE_NAME = "cart";

export type CookieCartItem = {
  productId: string;
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

// Drops items whose product no longer exists, so stale cookie entries
// left by deleted products get swept out on the next cart write.
const pruneStaleItems = async (items: CookieCartItem[]) => {
  if (items.length === 0) return items;

  const products = await getProductsByIds(items.map((item) => item.productId));
  const validIds = new Set(products.map((product) => product.id));

  return items.filter((item) => validIds.has(item.productId));
};

// Shared guard: a quantity at or below 0 removes the item instead of
// leaving a zero/negative-quantity entry in the cart.
const setItemQuantity = (
  items: CookieCartItem[],
  productId: string,
  quantity: number,
): CookieCartItem[] => {
  if (quantity <= 0) {
    return items.filter((item) => item.productId !== productId);
  }

  const existing = items.find((item) => item.productId === productId);
  if (existing) {
    existing.quantity = quantity;
    return items;
  }

  return [...items, { productId, quantity }];
};

export const addCartItem = async (productId: string, quantity = 1) => {
  const store = await cookies();
  const items = await pruneStaleItems(
    parseCookie(store.get(CART_COOKIE_NAME)?.value),
  );

  const existing = items.find((item) => item.productId === productId);
  const nextQuantity = (existing?.quantity ?? 0) + quantity;

  await setCookie(setItemQuantity(items, productId, nextQuantity));
};

export const clearCart = async () => {
  const store = await cookies();
  store.delete(CART_COOKIE_NAME);
};

export const deleteCartItem = async (productId: string) => {
  const store = await cookies();
  const items = await pruneStaleItems(
    parseCookie(store.get(CART_COOKIE_NAME)?.value),
  );

  await setCookie(items.filter((item) => item.productId !== productId));
};

export const updateCartItemQuantity = async (
  productId: string,
  quantity: number,
) => {
  const store = await cookies();
  const items = await pruneStaleItems(
    parseCookie(store.get(CART_COOKIE_NAME)?.value),
  );

  await setCookie(setItemQuantity(items, productId, quantity));
};

export const getCartFromCookies = async () => {
  const store = await cookies();
  const items = parseCookie(store.get(CART_COOKIE_NAME)?.value);

  if (items.length === 0) return [];

  const products = await getProductsByIds(
    items.map((item) => item.productId),
  );
  const productById = new Map(products.map((product) => [product.id, product]));

  return items
    .map((item) => {
      const product = productById.get(item.productId);
      return product ? { quantity: item.quantity, product } : null;
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);
};
