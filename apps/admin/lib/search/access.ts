import type { AdminSearchAccess } from "@repo/search/server/admin-search"
import { hasRolePermission } from "../auth/permissions"
import { maskEmail } from "../utils"

export function getAdminSearchAccess(
  role: string | null | undefined
): AdminSearchAccess {
  const access: AdminSearchAccess = {
    groups: [],
    maskEmail: role === "demo" ? maskEmail : undefined,
  }
  if (hasRolePermission(role, "products", "read")) access.groups.push("product")
  if (hasRolePermission(role, "categories", "read"))
    access.groups.push("category")
  if (hasRolePermission(role, "orders", "read")) access.groups.push("order")
  if (hasRolePermission(role, "customers", "read"))
    access.groups.push("customer")
  if (
    hasRolePermission(role, "user", "list") &&
    hasRolePermission(role, "user", "get")
  ) {
    access.groups.push("staff")
  }
  return access
}
