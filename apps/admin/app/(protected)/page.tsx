import { headers } from "next/headers"
import Link from "next/link"
import { redirect } from "next/navigation"
import { Plus, ShoppingBag } from "lucide-react"

import { getOrdersOverview } from "@/features/orders/queries"
import { getLowStockVariantCount } from "@/features/products/queries"
import { auth } from "@/lib/auth"
import { hasRolePermission } from "@/lib/auth/permissions"
import { maskEmail } from "@/lib/utils"
import { Button } from "@repo/ui/button"
import { cn } from "@repo/ui/utils"
import { FindCustomerShortcut } from "./_components/global-search"
import { OverviewAttention } from "./_components/overview-attention"
import { OverviewMetrics } from "./_components/overview-metrics"
import { OverviewRecentOrders } from "./_components/overview-recent-orders"
import { OverviewTrends } from "./_components/overview-trends"

const overviewDateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "full",
  timeZone: "UTC",
})

export default async function Page() {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session?.user) {
    redirect("/login")
  }

  const { role } = session.user
  const canViewOrders = hasRolePermission(role, "orders", "read")

  if (!hasRolePermission(role, "analytics", "read")) {
    if (canViewOrders) {
      redirect("/orders")
    }
    redirect("/unauthorized")
  }

  const canAddProduct = hasRolePermission(role, "products", "create")
  const canViewProducts = hasRolePermission(role, "products", "read")
  const canViewCustomers = hasRolePermission(role, "customers", "read")
  const now = new Date()

  const [orders, lowStock] = await Promise.all([
    canViewOrders ? getOrdersOverview(now) : null,
    canViewProducts ? getLowStockVariantCount() : null,
  ])

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:gap-8 lg:py-8 xl:px-8">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div>
          <h1 className="text-3xl leading-none font-semibold tracking-tight sm:text-4xl">Overview</h1>
          <p className="mt-2 text-sm text-muted-foreground">{overviewDateFormatter.format(now)}</p>
        </div>
        {(canAddProduct || canViewOrders || canViewCustomers) && (
          <nav aria-label="Quick actions" className="flex flex-wrap items-center gap-2">
            {canAddProduct && (
              <Button className="h-11" nativeButton={false} render={<Link href="/products/new" />}>
                <Plus aria-hidden="true" />
                Add product
              </Button>
            )}
            {canViewOrders && (
              <Button variant="outline" className="h-11" nativeButton={false} render={<Link href="/orders" />}>
                <ShoppingBag aria-hidden="true" />
                View orders
              </Button>
            )}
            {canViewCustomers && <FindCustomerShortcut />}
          </nav>
        )}
      </div>
      <div className={cn("grid min-w-0 items-start gap-5 lg:gap-6", orders && "lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]")}>
        <OverviewAttention awaitingFulfillment={orders?.awaitingFulfillment ?? null} lowStock={lowStock} />
        {orders && (
          <>
            <OverviewMetrics orders={orders} />
            <OverviewTrends daily={orders.daily} />
            <OverviewRecentOrders
              orders={role === "demo"
                ? orders.recent.map((order) => ({ ...order, customerEmail: maskEmail(order.customerEmail) }))
                : orders.recent}
            />
          </>
        )}
      </div>
    </div>
  )
}
