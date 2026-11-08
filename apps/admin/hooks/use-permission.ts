"use client"

import { authClient } from "@/lib/auth/client"
import {
  hasRolePermission,
  type Resource,
  type Statements,
} from "@/lib/auth/permissions"
import { useCurrentRole } from "@/app/(protected)/_components/role-provider"

export function usePermission<R extends Resource>(
  resource: R,
  action: Statements[R][number]
): boolean {
  const contextRole = useCurrentRole()
  const { data: session } = authClient.useSession()
  const role = contextRole ?? session?.user?.role
  return hasRolePermission(role, resource, action)
}
