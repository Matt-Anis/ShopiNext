"use client"

import Link from "next/link"
import { Plus, Users } from "lucide-react"

import type { StaffMember } from "./columns"
import { getColumns } from "./columns"
import { DataTable } from "@repo/ui/data-table"
import { Button } from "@repo/ui/button"

interface StaffClientProps {
  users: StaffMember[]
}

export function StaffClient({ users }: StaffClientProps) {
  const columns = getColumns()

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Staff</h1>
        <Button
          nativeButton={false}
          render={<Link href="/staff/new" />}
          data-testid="new-staff-button"
        >
          <Plus />
          New staff
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={users}
        searchColumn="name"
        searchPlaceholder="Search staff..."
        emptyIcon={<Users />}
        emptyTitle="No staff members yet"
        emptyDescription="Staff you add will appear here."
        emptyTestId="staff-empty-state"
      />
    </>
  )
}
