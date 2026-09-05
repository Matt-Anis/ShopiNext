import { headers } from "next/headers"

import { auth } from "@/lib/auth"
import { StaffClient } from "./_components/staff-client"

export default async function StaffPage() {
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
