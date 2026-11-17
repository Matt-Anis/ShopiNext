import type { Metadata } from "next"
import { redirect } from "next/navigation"
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
    <div>
      <header className="mb-8">
        <h1 className="page-heading">Your orders</h1>
        <p className="mt-5 text-muted-foreground">
          View your purchases and their latest updates.
        </p>
      </header>

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
