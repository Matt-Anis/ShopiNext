import type { SearchReadDatabase } from "../db/client";
import type { SearchPageOptions } from "./pagination";

export function readOrdersPage(
  db: SearchReadDatabase,
  page: SearchPageOptions,
) {
  return db.query.orders.findMany({
    columns: {
      id: true,
      checkoutEmail: true,
      status: true,
      totalAmount: true,
      createdAt: true,
      archivedAt: true,
    },
    where: (order, { and, eq, gt }) =>
      and(
        page.entityId ? eq(order.id, page.entityId) : undefined,
        page.afterId ? gt(order.id, page.afterId) : undefined,
      ),
    orderBy: (order, { asc }) => [asc(order.id)],
    limit: page.limit,
  });
}
