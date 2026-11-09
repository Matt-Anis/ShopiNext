"use server"

import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { and, eq, ne } from "drizzle-orm"

import { db } from "@/db"
import { adminSession, adminUser } from "@repo/db/admin/auth-schema"
import { auth } from "@/lib/auth"
import { requireActionPermission } from "@/lib/auth/guards"
import {
  hasRolePermission,
  roles,
  type RoleName,
} from "@/lib/auth/permissions"
import { isUniqueViolation } from "@/lib/utils"

function assertValidRole(role: string): asserts role is RoleName {
  if (!(role in roles)) {
    throw new Error("Invalid role")
  }
}

export async function createStaffAccount(
  name: string,
  email: string,
  role: RoleName = "staff"
) {
  await requireActionPermission("user", "create")

  const trimmedName = name.trim()
  const trimmedEmail = email.trim()

  if (!trimmedName) throw new Error("Name is required")
  if (!trimmedEmail) throw new Error("Email is required")
  assertValidRole(role)

  const { user } = await auth.api.createUser({
    body: { name: trimmedName, email: trimmedEmail, role },
    headers: await headers(),
  })

  await auth.api.requestPasswordReset({
    body: { email: user.email, redirectTo: "/reset-password" },
  })

  revalidatePath("/staff")
  return { id: user.id }
}

export async function updateStaffProfile(
  userId: string,
  data: { name: string; email: string }
) {
  const session = await requireActionPermission("user", "update")

  const trimmedName = data.name.trim()
  const trimmedEmail = data.email.trim()

  if (!trimmedName) throw new Error("Name is required")
  if (!trimmedEmail) throw new Error("Email is required")

  const existing = await db.query.adminUser.findFirst({
    where: eq(adminUser.id, userId),
    columns: { id: true, email: true },
  })

  if (!existing) {
    throw new Error("Staff member not found")
  }

  if (trimmedEmail.toLowerCase() !== existing.email.toLowerCase()) {
    if (!hasRolePermission(session.user.role, "user", "set-email")) {
      throw new Error("Unauthorized")
    }
  }

  try {
    await db
      .update(adminUser)
      .set({
        name: trimmedName,
        email: trimmedEmail,
      })
      .where(eq(adminUser.id, userId))
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new Error("A staff member with this email already exists")
    }
    console.error("[staff] updateStaffProfile failed:", error)
    throw error
  }

  revalidatePath("/staff")
  revalidatePath(`/staff/${userId}`)
}

export async function updateStaffRole(userId: string, role: RoleName) {
  const session = await requireActionPermission("user", "set-role")

  if (session.user.id === userId) {
    throw new Error("You cannot change your own role")
  }

  assertValidRole(role)

  await db
    .update(adminUser)
    .set({ role })
    .where(eq(adminUser.id, userId))

  revalidatePath("/staff")
  revalidatePath(`/staff/${userId}`)
}

export async function sendStaffPasswordReset(userId: string) {
  await requireActionPermission("user", "set-password")

  const target = await db.query.adminUser.findFirst({
    where: eq(adminUser.id, userId),
    columns: { email: true },
  })

  if (!target) {
    throw new Error("Staff member not found")
  }

  await auth.api.requestPasswordReset({
    body: { email: target.email, redirectTo: "/reset-password" },
  })
}

export async function banStaffMember(userId: string, banReason?: string) {
  const session = await requireActionPermission("user", "ban")

  if (session.user.id === userId) {
    throw new Error("You cannot ban your own account")
  }

  await db.transaction(async (tx) => {
    await tx
      .update(adminUser)
      .set({
        banned: true,
        banReason: banReason?.trim() || null,
        banExpires: null,
      })
      .where(eq(adminUser.id, userId))

    await tx.delete(adminSession).where(eq(adminSession.userId, userId))
  })

  revalidatePath("/staff")
  revalidatePath(`/staff/${userId}`)
}

export async function unbanStaffMember(userId: string) {
  await requireActionPermission("user", "ban")

  await db
    .update(adminUser)
    .set({
      banned: false,
      banReason: null,
      banExpires: null,
    })
    .where(eq(adminUser.id, userId))

  revalidatePath("/staff")
  revalidatePath(`/staff/${userId}`)
}

export async function deleteStaffMember(userId: string) {
  const session = await requireActionPermission("user", "delete")

  if (session.user.id === userId) {
    throw new Error("You cannot delete your own account")
  }

  await db.delete(adminUser).where(eq(adminUser.id, userId))
}

export async function revokeStaffSession(userId: string, sessionId: string) {
  const session = await requireActionPermission("session", "revoke")

  if (session.session.id === sessionId) {
    throw new Error("You cannot revoke your current active session")
  }

  await db
    .delete(adminSession)
    .where(and(eq(adminSession.id, sessionId), eq(adminSession.userId, userId)))

  revalidatePath(`/staff/${userId}`)
}

export async function revokeAllStaffSessions(userId: string) {
  const session = await requireActionPermission("session", "revoke")

  if (session.user.id === userId) {
    await db
      .delete(adminSession)
      .where(
        and(
          eq(adminSession.userId, userId),
          ne(adminSession.id, session.session.id)
        )
      )
  } else {
    await db.delete(adminSession).where(eq(adminSession.userId, userId))
  }

  revalidatePath(`/staff/${userId}`)
}
