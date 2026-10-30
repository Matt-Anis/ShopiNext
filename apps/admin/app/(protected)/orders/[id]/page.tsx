import { notFound } from "next/navigation"

import { requireSession } from "@/lib/session"
import { getOrderById, getOrderNotes } from "@/features/orders/queries"
import { OrderHeader } from "./_components/order-header"
import { OrderItemsCard } from "./_components/order-items-card"
import { OrderTimeline } from "./_components/order-timeline"
import { OrderStaffNotes } from "./_components/order-staff-notes"
import { OrderCustomerCard } from "./_components/order-customer-card"

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [order, notes, session] = await Promise.all([
    getOrderById(id),
    getOrderNotes(id),
    requireSession(),
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
          <div className="p-6">
            <OrderStaffNotes
              orderId={order.id}
              notes={notes}
              currentUserId={session.user.id}
            />
          </div>
        </div>
        <div className="h-fit divide-y divide-border rounded-2xl border border-border lg:sticky lg:top-9">
          <div className="p-6">
            <OrderCustomerCard
              customerEmail={order.checkoutEmail}
              userId={order.userId}
              stripeSessionId={order.stripeSessionId}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
