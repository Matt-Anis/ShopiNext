import { eq } from "drizzle-orm";
import { db } from "@/db";
import { cart, images } from "@/db/schema";

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
