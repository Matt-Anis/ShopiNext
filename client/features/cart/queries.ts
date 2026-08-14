import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { cart, cartItems, images } from "@/db/schema";

export type Cart = Awaited<ReturnType<typeof getCartFromDb>>;

export const getCartFromDb = async (userId: string) => {
  const result = await db.query.cart.findFirst({
    where: eq(cart.userId, userId),
    with: {
      items: {
        with: {
          product: {
            with: {
              images: {
                where: eq(images.isPrimary, true),
                limit: 1,
              },
            },
          },
        },
      },
    },
  });

  return result ?? null;
};

// Scalar subquery resolving a user's cart id inline, so callers don't
// need a separate round trip before reading/writing cart_items.
const cartIdForUser = (userId: string) =>
  db.select({ id: cart.id }).from(cart).where(eq(cart.userId, userId));

const ensureCartId = async (userId: string) => {
  const [row] = await db
    .insert(cart)
    .values({ userId })
    .onConflictDoUpdate({ target: cart.userId, set: { userId } })
    .returning({ id: cart.id });

  return row.id;
};

export const createCartItem = async (
  userId: string,
  productId: string,
  quantity = 1,
) => {
  const cartId = await ensureCartId(userId);

  await db
    .insert(cartItems)
    .values({ cartId, productId, quantity })
    .onConflictDoUpdate({
      target: [cartItems.cartId, cartItems.productId],
      set: { quantity: sql`${cartItems.quantity} + ${quantity}` },
    });
};

export const updateCartItemQuantity = async (
  userId: string,
  productId: string,
  quantity: number,
) => {
  if (quantity <= 0) {
    await deleteCartItem(userId, productId);
    return;
  }

  await db
    .update(cartItems)
    .set({ quantity })
    .where(
      and(
        inArray(cartItems.cartId, cartIdForUser(userId)),
        eq(cartItems.productId, productId),
      ),
    );
};

export const deleteCartItem = async (userId: string, productId: string) => {
  await db
    .delete(cartItems)
    .where(
      and(
        inArray(cartItems.cartId, cartIdForUser(userId)),
        eq(cartItems.productId, productId),
      ),
    );
};
