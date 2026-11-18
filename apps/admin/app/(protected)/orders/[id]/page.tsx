import { notFound } from "next/navigation"

import { requirePermission } from "@/lib/auth/guards"
import { maskEmail } from "@/lib/utils"
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
    requirePermission("orders", "read"),
  ])

  if (!order) {
    notFound()
  }

  const isDemo = session.user.role === "demo"
  const checkoutEmail = isDemo ? maskEmail(order.checkoutEmail) : order.checkoutEmail
  const displayOrder = isDemo ? { ...order, checkoutEmail } : order

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-9">
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_20rem] xl:gap-8">
        <div className="min-w-0 divide-y divide-border rounded-xl border border-border bg-card">
          <div className="p-4 sm:p-6">
            <OrderHeader order={displayOrder} />
          </div>
          <div className="p-4 sm:p-6">
            <OrderItemsCard
              items={order.items}
              totalAmount={order.totalAmount}
            />
          </div>
          <div className="p-4 sm:p-6">
            <OrderTimeline events={order.timelineEvents} />
          </div>
          <div className="p-4 sm:p-6">
            <OrderStaffNotes
              orderId={order.id}
              notes={notes}
              currentUserId={session.user.id}
            />
          </div>
        </div>
        <div className="h-fit min-w-0 rounded-xl border border-border bg-card xl:sticky xl:top-(--admin-header-offset)">
          <div className="p-4 sm:p-6">
            <OrderCustomerCard
              customerEmail={checkoutEmail}
              userId={order.userId}
              stripeSessionId={order.stripeSessionId}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
