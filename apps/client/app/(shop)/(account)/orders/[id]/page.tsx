import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { getCustomerOrder } from "@/features/orders/customer-queries"
import { formatOrderDate, formatOrderReference } from "@/features/orders/format"
import { OrderStatusBadge } from "../_components/order-status-badge"
import { OrderItemsTable } from "./_components/order-items-table"
import { OrderTimeline } from "./_components/order-timeline"

export const metadata: Metadata = {
  title: "Order details | ShopiNext",
  robots: { index: false, follow: false },
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const order = await getCustomerOrder(id)

  return (
    <div>
      <Link
        href="/orders"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to orders
      </Link>
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            {formatOrderReference(order.id)}
          </h1>
          <p className="mt-2 text-muted-foreground">
            Placed on{" "}
            <time dateTime={order.createdAt.toISOString()}>
              {formatOrderDate(order.createdAt)}
            </time>
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </header>

      <div className="space-y-8">
        <OrderItemsTable items={order.items} totalAmount={order.totalAmount} />
        <OrderTimeline events={order.timelineEvents} />
      </div>
    </div>
  )
}
