import Link from "next/link"
import { ExternalLink, ShoppingBag } from "lucide-react"

import { Badge } from "@repo/ui/badge"
import { Card, CardContent, CardHeader } from "@repo/ui/card"
import { formatPrice } from "@/lib/utils"
import type { CustomerOrderSummary } from "@/features/customers/queries"
import type { OrderStatus } from "@repo/db/public/schema"

interface CustomerOrdersCardProps {
  orders: CustomerOrderSummary[]
}

const statusVariantMap: Record<
  OrderStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  paid: "secondary",
  processing: "secondary",
  shipped: "default",
  delivered: "default",
  cancelled: "destructive",
  refunded: "outline",
}

export function CustomerOrdersCard({ orders }: CustomerOrdersCardProps) {
  return (
    <Card size="sm" className="@container/order-history min-w-0 gap-0 self-start rounded-xl border border-border pb-0 shadow-none ring-0 dark:ring-0">
      <CardHeader className="flex items-center gap-2 border-b border-border">
        <ShoppingBag aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
        <h2 className="text-sm font-semibold">Order history</h2>
      </CardHeader>
      <CardContent className="px-0">
        {orders.length === 0 ? (
          <div className="space-y-1 px-4 py-8 text-center">
            <p className="text-sm font-medium text-foreground">
              No orders yet
            </p>
            <p className="text-sm text-muted-foreground">
              Orders placed by this customer will appear here.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {orders.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/orders/${order.id}`}
                  className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-2 px-4 py-3 hover:bg-muted/50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring @min-[34rem]/order-history:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] @min-[34rem]/order-history:items-center"
                >
                  <div className="min-w-0 space-y-1">
                    <span className="block text-sm font-semibold">
                      Order <span className="font-mono text-xs">#{order.id.slice(0, 8)}</span>
                    </span>
                    <time dateTime={order.createdAt.toISOString()} className="block text-xs text-muted-foreground">
                      {order.createdAt.toLocaleDateString(undefined, { dateStyle: "medium" })}
                    </time>
                  </div>
                  <div className="col-span-full flex min-w-0 flex-wrap items-center gap-1.5 @min-[34rem]/order-history:col-span-1">
                    <Badge variant={statusVariantMap[order.status] ?? "secondary"} className="capitalize">
                      {order.status}
                    </Badge>
                    {order.archivedAt && <Badge variant="outline">Archived</Badge>}
                    <span className="text-xs text-muted-foreground">
                      {order.itemCount} {order.itemCount === 1 ? "item" : "items"}
                    </span>
                  </div>
                  <div className="col-start-2 row-start-1 flex items-center gap-2 self-center justify-self-end @min-[34rem]/order-history:col-start-auto @min-[34rem]/order-history:row-start-auto">
                    <span className="text-sm font-semibold tabular-nums">{formatPrice(order.totalAmount)}</span>
                    <ExternalLink aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
