import { notFound } from "next/navigation"

import { requirePermission } from "@/lib/auth/guards"
import { maskEmail } from "@/lib/utils"
import { getStaffById } from "@/features/staff/queries"
import { StaffHeader } from "./_components/staff-header"
import { StaffProfileCard } from "./_components/staff-profile-card"
import { StaffRoleCard } from "./_components/staff-role-card"
import { StaffSecurityCard } from "./_components/staff-security-card"
import { StaffAuthCard } from "./_components/staff-auth-card"
import { StaffSessionsCard } from "./_components/staff-sessions-card"

export default async function StaffDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await requirePermission("user", "get")
  const { id } = await params
  const rawStaff = await getStaffById(id)

  if (!rawStaff) {
    notFound()
  }

  const staff =
    session.user.role === "demo"
      ? { ...rawStaff, email: maskEmail(rawStaff.email) }
      : rawStaff

  return (
    <div className="px-8 py-9">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-6">
          <StaffHeader staff={staff} />
          <StaffProfileCard
            key={`${staff.id}:${staff.name}:${staff.email}`}
            staff={staff}
          />
          <StaffRoleCard
            key={`${staff.id}:${staff.role}`}
            staff={staff}
            currentUserId={session.user.id}
          />
          <StaffSecurityCard
            staff={staff}
            currentUserId={session.user.id}
          />
          <StaffSessionsCard
            staffId={staff.id}
            sessions={staff.sessions}
            currentSessionId={session.session.id}
          />
        </div>
        <div className="flex flex-col gap-6 lg:sticky lg:top-9 lg:self-start">
          <StaffAuthCard
            providers={staff.providers}
            emailVerified={staff.emailVerified}
          />
        </div>
      </div>
    </div>
  )
}
