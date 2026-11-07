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
    <div className="px-8 py-9">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-6">
          <CustomerHeader customer={customer} />
          <CustomerKpis metrics={customer.metrics} />
          <CustomerOrdersCard orders={customer.orders} />
        </div>
        <div className="flex flex-col gap-6 lg:sticky lg:top-9 lg:self-start">
          <CustomerAuthCard
            providers={customer.providers}
            emailVerified={customer.emailVerified}
          />
          <CustomerSessionsCard sessions={customer.sessions} />
        </div>
      </div>
    </div>
  )
}
