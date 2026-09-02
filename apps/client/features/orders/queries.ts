import { and, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import { orders, orderItems, productVariants } from "@repo/db/public/schema";

export class OutOfStockError extends Error {
  constructor(public variantId: string) {
    super(`Variant ${variantId} does not have enough stock`);
  }
}

type CreateOrderInput = {
  stripeSessionId: string;
  userId: string | null;
  checkoutEmail: string;
  totalAmount: number;
  items: {
    variantId: string;
    quantity: number;
    priceAtPurchase: number;
  }[];
};

export const createOrder = async ({
  stripeSessionId,
  userId,
  checkoutEmail,
  totalAmount,
  items,
}: CreateOrderInput) => {
  return db.transaction(async (tx) => {
    const [order] = await tx
      .insert(orders)
      .values({ stripeSessionId, userId, checkoutEmail, totalAmount })
      .onConflictDoNothing({ target: orders.stripeSessionId })
      .returning({ id: orders.id });

    if (!order) return null;

    for (const item of items) {
      const [decremented] = await tx
        .update(productVariants)
        .set({ stock: sql`${productVariants.stock} - ${item.quantity}` })
        .where(
          and(
            eq(productVariants.id, item.variantId),
            gte(productVariants.stock, item.quantity),
            gte(productVariants.maxPerOrder, item.quantity),
          ),
        )
        .returning({ id: productVariants.id });

      if (!decremented) {
        throw new OutOfStockError(item.variantId);
      }
    }

    await tx.insert(orderItems).values(
      items.map((item) => ({
        orderId: order.id,
        variantId: item.variantId,
        quantity: item.quantity,
        priceAtPurchase: item.priceAtPurchase,
      })),
    );

    return order;
  });
};
