import { randomUUID } from "node:crypto"
import { db } from "../client"
import { adminUser, adminAccount } from "@repo/db/admin/auth-schema"

// Plain text password: "secret"
const ADMIN_PASSWORD_HASH =
  "414c9f45c6663846e7f6308decf01f3a:9cae01ed2b6d3d4d30d882afb64af6c74866d623ee78a39676d9da259af48435aaf6fd29aceb4da30b64b3aa7e630d841ebe6b0ba2981ae590a35bfbb6ff22cf"

export async function seedAdminUsers() {
  console.log("Seeding admin accounts...")

  const ownerId = randomUUID()
  const managerId = randomUUID()
  const staffId = randomUUID()
  const demoId = randomUUID()
  const adminId = randomUUID()

  await db.insert(adminUser).values([
    {
      id: ownerId,
      name: "Store Owner",
      email: "owner@example.com",
      emailVerified: true,
      role: "owner",
    },
    {
      id: managerId,
      name: "Store Manager",
      email: "manager@example.com",
      emailVerified: true,
      role: "manager",
    },
    {
      id: staffId,
      name: "Staff Member",
      email: "staff@example.com",
      emailVerified: true,
      role: "staff",
    },
    {
      id: demoId,
      name: "Demo User",
      email: "demo@example.com",
      emailVerified: true,
      role: "demo",
    },
    {
      id: adminId,
      name: "Admin",
      email: "admin@example.com",
      emailVerified: true,
      role: "owner",
    },
  ])

  await db.insert(adminAccount).values([
    {
      id: randomUUID(),
      userId: ownerId,
      accountId: ownerId,
      providerId: "credential",
      password: ADMIN_PASSWORD_HASH,
    },
    {
      id: randomUUID(),
      userId: managerId,
      accountId: managerId,
      providerId: "credential",
      password: ADMIN_PASSWORD_HASH,
    },
    {
      id: randomUUID(),
      userId: staffId,
      accountId: staffId,
      providerId: "credential",
      password: ADMIN_PASSWORD_HASH,
    },
    {
      id: randomUUID(),
      userId: demoId,
      accountId: demoId,
      providerId: "credential",
      password: ADMIN_PASSWORD_HASH,
    },
    {
      id: randomUUID(),
      userId: adminId,
      accountId: adminId,
      providerId: "credential",
      password: ADMIN_PASSWORD_HASH,
    },
  ])

  return { adminId: ownerId, ownerId, managerId, staffId, demoId }
}
