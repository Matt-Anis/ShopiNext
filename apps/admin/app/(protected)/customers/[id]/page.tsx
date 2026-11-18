import { notFound } from "next/navigation"

import { requirePermission } from "@/lib/auth/guards"
import { maskEmail } from "@/lib/utils"
import { getCustomerById } from "@/features/customers/queries"
import { CustomerHeader } from "./_components/customer-header"
import { CustomerKpis } from "./_components/customer-kpis"
import { CustomerOrdersCard } from "./_components/customer-orders-card"
import { CustomerAuthCard } from "./_components/customer-auth-card"
import { CustomerSessionsCard } from "./_components/customer-sessions-card"

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await requirePermission("customers", "read")
  const { id } = await params
  const rawCustomer = await getCustomerById(id)

  if (!rawCustomer) {
    notFound()
  }

  const customer =
    session.user.role === "demo"
      ? { ...rawCustomer, email: maskEmail(rawCustomer.email) }
      : rawCustomer

  return (
    <div className="@container/customer mx-auto w-full max-w-7xl min-w-0 space-y-5 px-4 py-6 sm:space-y-6 sm:px-6 lg:px-8 lg:py-9">
      <CustomerHeader customer={customer} />
      <CustomerKpis metrics={customer.metrics} />
      <div className="grid min-w-0 gap-5 @min-[60rem]/customer:grid-cols-[minmax(0,1fr)_18rem] @min-[60rem]/customer:gap-6">
        <CustomerOrdersCard orders={customer.orders} />
        <aside
          aria-label="Customer account"
          className="grid min-w-0 gap-5 @min-[36rem]/customer:grid-cols-2 @min-[60rem]/customer:grid-cols-1 @min-[60rem]/customer:self-start"
        >
          <CustomerAuthCard providers={customer.providers} />
          <CustomerSessionsCard sessions={customer.sessions} />
        </aside>
      </div>
    </div>
  )
}
