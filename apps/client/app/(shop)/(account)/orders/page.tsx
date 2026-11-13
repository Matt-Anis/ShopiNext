import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { AccountNavigation } from "@/features/account/components/account-navigation"
import { getCustomerOrders } from "@/features/orders/customer-queries"
import { ordersPageHref, parseOrdersPage } from "@/features/orders/pagination"
import { OrderPagination } from "./_components/order-pagination"
import { OrderSummaryCard } from "./_components/order-summary-card"
import { OrdersEmptyState } from "./_components/orders-empty-state"

export const metadata: Metadata = {
  title: "Your orders | ShopiNext",
  robots: { index: false, follow: false },
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string | string[] }>
}) {
  const requestedPage = parseOrdersPage((await searchParams).page)
  const { orders, page, totalPages } = await getCustomerOrders(requestedPage)

  if (page !== requestedPage) {
    redirect(ordersPageHref(page))
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 md:py-16">
      <header className="mb-8">
        <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          Your orders
        </h1>
        <p className="mt-2 text-muted-foreground">
          View your purchases and their latest updates.
        </p>
      </header>

      <AccountNavigation currentPath="/orders" />

      {orders.length === 0 ? (
        <OrdersEmptyState />
      ) : (
        <>
          <ol className="space-y-5" aria-label="Your orders">
            {orders.map((order) => (
              <li key={order.id}>
                <OrderSummaryCard order={order} />
              </li>
            ))}
          </ol>
          <OrderPagination page={page} totalPages={totalPages} />
        </>
      )}
    </div>
  )
}
