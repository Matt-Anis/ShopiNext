import Link from "next/link"

import { Button } from "@repo/ui/button"
import { requirePermission } from "@/lib/auth/guards"
import { maskEmail } from "@/lib/utils"
import { getOrdersList } from "@/features/orders/queries"
import { orderViewLabels, parseOrderView } from "@/features/orders/views"
import { OrdersClient } from "./_components/orders-client"

export default async function OrdersPage({ searchParams }: PageProps<"/orders">) {
  const session = await requirePermission("orders", "read")
  const view = parseOrderView((await searchParams).view)
  const rawOrders = await getOrdersList({ view })
  const orders =
    session.user.role === "demo"
      ? rawOrders.map((order) => ({
          ...order,
          customerEmail: maskEmail(order.customerEmail),
        }))
      : rawOrders

  return (
    <div className="flex flex-col gap-5 px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {view ? orderViewLabels[view] : "Orders"}
          </h1>
          {(view === "today" || view === "paid-today") && (
            <p className="mt-1 text-sm text-muted-foreground">Orders placed today (UTC)</p>
          )}
        </div>
        {view && (
          <Button variant="outline" nativeButton={false} render={<Link href="/orders" />}>
            All orders
          </Button>
        )}
      </div>
      <OrdersClient orders={orders} view={view} />
    </div>
  )
}
