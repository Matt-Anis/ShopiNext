"use client"

import { authClient } from "@/lib/auth/client"
import {
  hasRolePermission,
  type Resource,
  type Statements,
} from "@/lib/auth/permissions"

export function usePermission<R extends Resource>(
  resource: R,
  action: Statements[R][number]
): boolean {
  const { data: session } = authClient.useSession()
  return hasRolePermission(session?.user?.role, resource, action)
}
