import { getCustomersList } from "@/features/customers/queries"
import { CustomersClient } from "./_components/customers-client"

export default async function CustomersPage() {
  const customers = await getCustomersList()

  return (
    <div className="flex flex-col gap-4 px-4 py-6">
      <CustomersClient customers={customers} />
    </div>
  )
}
