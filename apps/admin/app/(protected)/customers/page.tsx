import { requirePermission } from "@/lib/auth/guards"
import { maskEmail } from "@/lib/utils"
import { getCustomersList } from "@/features/customers/queries"
import { CustomersClient } from "./_components/customers-client"

export default async function CustomersPage() {
  const session = await requirePermission("customers", "read")
  const rawCustomers = await getCustomersList()
  const customers =
    session.user.role === "demo"
      ? rawCustomers.map((customer) => ({
          ...customer,
          email: maskEmail(customer.email),
        }))
      : rawCustomers

  return (
    <div className="flex flex-col gap-4 px-4 py-6">
      <CustomersClient customers={customers} />
    </div>
  )
}
