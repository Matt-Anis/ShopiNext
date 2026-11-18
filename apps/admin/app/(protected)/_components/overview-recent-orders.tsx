import Link from "next/link"
import { ChevronRight, ShoppingBag } from "lucide-react"

import type { OrdersOverview } from "@/features/orders/queries"
import { formatPrice } from "@/lib/utils"
import { Button } from "@repo/ui/button"
import { Card, CardHeader } from "@repo/ui/card"
import { OrderStatusBadge } from "../orders/_components/order-status-badge"

const orderDateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeZone: "UTC",
})

export function OverviewRecentOrders({ orders }: { orders: OrdersOverview["recent"] }) {
  return (
    <section aria-labelledby="overview-recent-orders" className="min-w-0 lg:col-start-1 lg:row-start-2">
      <Card className="gap-0 rounded-2xl border border-border py-0 shadow-none ring-0">
        <CardHeader className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-4 py-2.5 sm:px-5">
          <h2 id="overview-recent-orders" className="text-lg font-semibold tracking-tight">Recent orders</h2>
          <Button variant="ghost" className="h-11" nativeButton={false} render={<Link href="/orders" />}>
            All orders
            <ChevronRight aria-hidden="true" />
          </Button>
        </CardHeader>
        {orders.length === 0 ? (
          <div className="flex items-center gap-3 border-t border-border px-4 py-5 text-muted-foreground sm:px-5">
            <ShoppingBag aria-hidden="true" className="size-5 shrink-0" />
            <p>No recent orders.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border border-t border-border">
            {orders.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/orders/${order.id}`}
                  className="flex min-h-16 min-w-0 items-center gap-2 px-4 py-3 outline-none hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset sm:gap-3 sm:px-5"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">Order {order.id.slice(0, 8)}</span>
                    <span className="mt-1 block truncate text-xs text-muted-foreground" title={order.customerEmail}>
                      {order.customerEmail}
                    </span>
                  </span>
                  <time dateTime={order.createdAt.toISOString()} className="hidden shrink-0 text-xs text-muted-foreground xl:block">
                    {orderDateFormatter.format(order.createdAt)}
                  </time>
                  <span className="grid shrink-0 justify-items-end gap-1 sm:flex sm:items-center sm:gap-3">
                    <OrderStatusBadge status={order.status} />
                    <span className="font-medium tabular-nums sm:min-w-[5.5rem] sm:text-right">{formatPrice(order.totalAmount)}</span>
                  </span>
                  <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </section>
  )
}
