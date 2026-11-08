import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { auth } from "./index"
import { hasRolePermission, type Resource, type Statements } from "./permissions"

export async function requirePermission<R extends Resource>(
  resource: R,
  action: Statements[R][number]
) {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session?.user) {
    redirect("/login")
  }

  if (!hasRolePermission(session.user.role, resource, action)) {
    redirect("/unauthorized")
  }

  return session
}

export async function assertActionPermission<R extends Resource>(
  resource: R,
  action: Statements[R][number]
) {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session?.user || !hasRolePermission(session.user.role, resource, action)) {
    return { ok: false as const, error: "Unauthorized" }
  }

  return { ok: true as const, session }
}

export async function requireActionPermission<R extends Resource>(
  resource: R,
  action: Statements[R][number]
) {
  const result = await assertActionPermission(resource, action)
  if (!result.ok) {
    throw new Error(result.error)
  }
  return result.session
}
