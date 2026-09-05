"use client"

import Link from "next/link"
import { Plus, Users } from "lucide-react"

import type { StaffMember } from "./columns"
import { getColumns } from "./columns"
import { DataTable } from "@repo/ui/data-table"
import { Button } from "@repo/ui/button"
import { useBreadcrumb } from "../../_components/breadcrumb-provider"

interface StaffClientProps {
  users: StaffMember[]
}

const breadcrumbItems = [{ label: "Staff" }]

export function StaffClient({ users }: StaffClientProps) {
  useBreadcrumb(breadcrumbItems)

  const columns = getColumns()

  return (
    <>
      <DataTable
        columns={columns}
        data={users}
        searchColumn="name"
        searchPlaceholder="Search staff..."
        actions={
          <Button
            nativeButton={false}
            render={<Link href="/staff/new" />}
            data-testid="new-staff-button"
          >
            <Plus />
            New staff
          </Button>
        }
        emptyIcon={<Users />}
        emptyTitle="No staff members yet"
        emptyDescription="Staff you add will appear here."
        emptyTestId="staff-empty-state"
        tableId="staff"
      />
    </>
  )
}
