import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@repo/ui/button"
import { Card, CardContent, CardHeader } from "@repo/ui/card"
import type { CustomerOrderListItem } from "@/features/orders/customer-queries"
import { formatOrderDate, formatOrderReference } from "@/features/orders/format"
import { formatPrice } from "@/lib/utils"
import { OrderStatusBadge } from "./order-status-badge"

export function OrderSummaryCard({ order }: { order: CustomerOrderListItem }) {
  return (
    <Card data-testid="order-summary" data-order-id={order.id}>
      <CardHeader className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-lg font-semibold">
            {formatOrderReference(order.id)}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Placed on{" "}
            <time dateTime={order.createdAt.toISOString()}>
              {formatOrderDate(order.createdAt)}
            </time>
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </CardHeader>
      <CardContent className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <dl className="min-w-0 space-y-3">
          <div>
            <dt className="text-sm text-muted-foreground">Products</dt>
            <dd className="mt-1 font-medium break-words">
              {order.items.map((item) => item.variant.product.name).join(", ")}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Total paid</dt>
            <dd className="mt-1 font-semibold">
              {formatPrice(order.totalAmount)}
            </dd>
          </div>
        </dl>
        <Button
          variant="outline"
          className="shrink-0 self-start sm:self-auto"
          nativeButton={false}
          render={<Link href={`/orders/${order.id}`} />}
          aria-label={`View ${formatOrderReference(order.id).toLowerCase()}`}
        >
          View order
          <ArrowRight />
        </Button>
      </CardContent>
    </Card>
  )
}
