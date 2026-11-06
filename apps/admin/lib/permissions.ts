import { createAccessControl, type RoleAuthorizeRequest } from "better-auth/plugins/access"
import { defaultStatements } from "better-auth/plugins/admin/access"

export const statement = {
  ...defaultStatements,
  products: ["create", "read", "update", "delete"],
  categories: ["create", "read", "update", "delete"],
  media: ["create", "read", "delete"],
  orders: ["create", "read", "update", "delete"],
  customers: ["read", "update"],
  analytics: ["read"],
} as const

export const ac = createAccessControl(statement)

export const owner = ac.newRole({
  user: [
    "create",
    "list",
    "set-role",
    "ban",
    "impersonate",
    "impersonate-admins",
    "delete",
    "set-password",
    "set-email",
    "get",
    "update",
  ],
  session: ["list", "revoke", "delete"],
  products: ["create", "read", "update", "delete"],
  categories: ["create", "read", "update", "delete"],
  media: ["create", "read", "delete"],
  orders: ["create", "read", "update", "delete"],
  customers: ["read", "update"],
  analytics: ["read"],
})

export const manager = ac.newRole({
  user: ["list", "get"],
  session: ["list"],
  products: ["create", "read", "update", "delete"],
  categories: ["create", "read", "update", "delete"],
  media: ["create", "read", "delete"],
  orders: ["create", "read", "update", "delete"],
  customers: ["read", "update"],
  analytics: ["read"],
})

export const staff = ac.newRole({
  orders: ["read", "update"],
  products: ["read"],
  categories: ["read"],
  media: ["read"],
  customers: ["read"],
})

export const demo = ac.newRole({
  products: ["read"],
  categories: ["read"],
  media: ["read"],
  orders: ["read"],
  customers: ["read"],
  analytics: ["read"],
})

export const roles = {
  owner,
  manager,
  staff,
  demo,
}

export type Statements = typeof statement
export type Resource = keyof Statements
export type RoleName = keyof typeof roles

export function hasRolePermission<R extends Resource>(
  roleName: string | null | undefined,
  resource: R,
  action: Statements[R][number]
): boolean {
  if (!roleName || !(roleName in roles)) return false
  const targetRole = roles[roleName as RoleName]
  const request: RoleAuthorizeRequest<Statements> = {
    [resource]: [action],
  }
  return targetRole.authorize(request).success
}



