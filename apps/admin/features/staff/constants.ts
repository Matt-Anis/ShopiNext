import type { RoleName } from "@/lib/auth/permissions"

export interface StaffRoleOption {
  value: RoleName
  label: string
  description: string
}

export const STAFF_ROLE_OPTIONS: StaffRoleOption[] = [
  {
    value: "staff",
    label: "Staff",
    description: "Can view catalog & customers and update orders.",
  },
  {
    value: "manager",
    label: "Manager",
    description:
      "Full access to catalog, orders, customers, and analytics; read-only staff view.",
  },
  {
    value: "owner",
    label: "Owner",
    description:
      "Full administrative access including staff, roles, and sessions.",
  },
  {
    value: "demo",
    label: "Demo",
    description: "Read-only dashboard access with customer PII masked.",
  },
]

export const STAFF_ROLE_LABELS: Record<RoleName, string> = {
  owner: "Owner",
  manager: "Manager",
  staff: "Staff",
  demo: "Demo",
}

export function formatStaffRole(role: string | null | undefined): string {
  const normalized = role ?? "staff"
  if (normalized in STAFF_ROLE_LABELS) {
    return STAFF_ROLE_LABELS[normalized as RoleName]
  }
  return normalized.charAt(0).toUpperCase() + normalized.slice(1)
}
