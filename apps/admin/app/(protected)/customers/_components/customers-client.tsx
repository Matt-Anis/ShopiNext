"use client"

import { useRouter } from "next/navigation"
import { Users } from "lucide-react"

import { DataTable } from "@repo/ui/data-table"
import { useBreadcrumb } from "../../_components/breadcrumb-provider"
import type { CustomerListItem } from "@/features/customers/queries"
import { getColumns } from "./columns"

interface CustomersClientProps {
  customers: CustomerListItem[]
}

export function CustomersClient({ customers }: CustomersClientProps) {
  useBreadcrumb([{ label: "Customers" }])

  const router = useRouter()

  const columns = getColumns({
    onView: (customer) => router.push(`/customers/${customer.id}`),
  })

  return (
    <DataTable
      columns={columns}
      data={customers}
      searchColumn="email"
      searchPlaceholder="Search customers by email..."
      emptyIcon={<Users />}
      emptyTitle="No customers yet"
      emptyDescription="Registered customer accounts will appear here."
      emptyTestId="customers-empty-state"
      tableId="customers"
    />
  )
}
