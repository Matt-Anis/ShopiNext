import { requirePermission } from "@/lib/auth/guards"
import { maskEmail } from "@/lib/utils"
import { getStaffList } from "@/features/staff/queries"
import { StaffClient } from "./_components/staff-client"

export default async function StaffPage() {
  const session = await requirePermission("user", "list")
  const rawUsers = await getStaffList()
  const users =
    session.user.role === "demo"
      ? rawUsers.map((staff) => ({
          ...staff,
          email: maskEmail(staff.email),
        }))
      : rawUsers

  return (
    <div className="flex flex-col gap-4 px-4 py-6">
      <StaffClient users={users} />
    </div>
  )
}
