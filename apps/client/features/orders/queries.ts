import { and, eq, gte, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@repo/db/public/auth-schema";
import {
  orders,
  orderItems,
  orderTimelineEvents,
  productVariants,
  type OrderStatus,
} from "@repo/db/public/schema";

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
  status: OrderStatus;
  items: {
    variantId: string;
    quantity: number;
    priceAtPurchase: number;
  }[];
};

export const getOrderByStripeSessionId = async (stripeSessionId: string) => {
  return db.query.orders.findFirst({
    where: eq(orders.stripeSessionId, stripeSessionId),
  });
};

export const markOrderConfirmationEmailSent = async (orderId: string) => {
  await db
    .update(orders)
    .set({ confirmationEmailSentAt: new Date() })
    .where(and(eq(orders.id, orderId), isNull(orders.confirmationEmailSentAt)));
};

export const createOrder = async ({
  stripeSessionId,
  userId,
  checkoutEmail,
  totalAmount,
  status,
  items,
}: CreateOrderInput) => {
  return db.transaction(async (tx) => {
    // Hold the customer reference until insertion so deletion cannot race the lookup.
    const [customer] = userId
      ? await tx
          .select({ id: user.id })
          .from(user)
          .where(eq(user.id, userId))
          .for("key share")
      : [];

    const [order] = await tx
      .insert(orders)
      .values({
        stripeSessionId,
        userId: customer?.id ?? null,
        checkoutEmail,
        totalAmount,
        status,
      })
      .onConflictDoNothing({ target: orders.stripeSessionId })
      .returning();

    if (!order) return null;

    for (const item of items) {
      const [decremented] = await tx
        .update(productVariants)
        .set({ stock: sql`${productVariants.stock} - ${item.quantity}` })
        .where(
          and(
            eq(productVariants.id, item.variantId),
            eq(productVariants.isActive, true),
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

    await tx.insert(orderTimelineEvents).values({
      orderId: order.id,
      status,
      note: "Order placed",
    });

    return order;
  });
};
