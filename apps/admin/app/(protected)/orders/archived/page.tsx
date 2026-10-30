import { getOrdersList } from "@/features/orders/queries"
import { OrdersClient } from "../_components/orders-client"

export default async function ArchivedOrdersPage() {
  const orders = await getOrdersList({ isArchived: true })

  return (
    <div className="flex flex-col gap-4 px-4 py-6">
      <OrdersClient orders={orders} isArchived />
    </div>
  )
}
