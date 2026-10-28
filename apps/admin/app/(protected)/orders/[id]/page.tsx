import { notFound } from "next/navigation"

import { getOrderById, getOrderNotes } from "@/features/orders/queries"
import { OrderHeader } from "./_components/order-header"
import { OrderItemsCard } from "./_components/order-items-card"
import { OrderTimeline } from "./_components/order-timeline"

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [order, notes] = await Promise.all([
    getOrderById(id),
    getOrderNotes(id),
  ])

  if (!order) {
    notFound()
  }

  return (
    <div className="px-8 py-9">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
        <div className="divide-y divide-border rounded-2xl border border-border">
          <div className="p-6">
            <OrderHeader order={order} />
          </div>
          <div className="p-6">
            <OrderItemsCard
              items={order.items}
              totalAmount={order.totalAmount}
            />
          </div>
          <div className="p-6">
            <OrderTimeline events={order.timelineEvents} />
          </div>
        </div>
        <div className="h-fit divide-y divide-border rounded-2xl border border-border lg:sticky lg:top-9">
          <div className="p-6">
            <h2 className="text-base font-semibold">Customer Details</h2>
          </div>
        </div>
      </div>
    </div>
  )
}
