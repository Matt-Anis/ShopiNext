import type { orders } from "@repo/db/public/schema";
import type { OrderDocument } from "@repo/search/server/documents";

type OrderProjectionSource = Pick<
  typeof orders.$inferSelect,
  "id" | "checkoutEmail" | "status" | "totalAmount" | "createdAt" | "archivedAt"
>;

export function projectOrder(order: OrderProjectionSource): OrderDocument {
  return {
    id: order.id,
    reference: order.id.slice(0, 8),
    checkoutEmail: order.checkoutEmail,
    status: order.status,
    totalAmount: order.totalAmount,
    createdAt: order.createdAt.toISOString(),
    archivedAt: order.archivedAt?.toISOString() ?? null,
  };
}
