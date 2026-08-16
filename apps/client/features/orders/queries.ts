import { db } from "@/db";
import { orders, orderItems } from "@/db/schema";

type CreateOrderInput = {
  stripeSessionId: string;
  userId: string | null;
  checkoutEmail: string;
  totalAmount: number;
  items: {
    productId: string;
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

    await tx.insert(orderItems).values(
      items.map((item) => ({
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
        priceAtPurchase: item.priceAtPurchase,
      })),
    );

    return order;
  });
};
