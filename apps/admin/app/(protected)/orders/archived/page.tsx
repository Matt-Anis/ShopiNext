import { requirePermission } from "@/lib/auth-guard"
import { maskEmail } from "@/lib/utils"
import { getOrdersList } from "@/features/orders/queries"
import { OrdersClient } from "../_components/orders-client"

export default async function ArchivedOrdersPage() {
  const session = await requirePermission("orders", "read")
  const rawOrders = await getOrdersList({ isArchived: true })
  const orders =
    session.user.role === "demo"
      ? rawOrders.map((order) => ({
          ...order,
          customerEmail: maskEmail(order.customerEmail),
        }))
      : rawOrders

  return (
    <div className="flex flex-col gap-4 px-4 py-6">
      <OrdersClient orders={orders} isArchived />
    </div>
  )
}
