import { headers } from "next/headers"

import { auth } from "@/lib/auth"
import { requirePermission } from "@/lib/auth/guards"
import { StaffClient } from "./_components/staff-client"

export default async function StaffPage() {
  await requirePermission("user", "list")

  const { users } = await auth.api.listUsers({
    query: {},
    headers: await headers(),
  })

  return (
    <div className="flex flex-col gap-4 px-4 py-6">
      <StaffClient users={users} />
    </div>
  )
}
