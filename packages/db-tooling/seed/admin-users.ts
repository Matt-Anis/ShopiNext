import { randomUUID } from "node:crypto"
import { db } from "../client"
import { adminUser, adminAccount } from "@repo/db/admin/auth-schema"

// Plain text password: "secret"
const ADMIN_PASSWORD_HASH =
  "414c9f45c6663846e7f6308decf01f3a:9cae01ed2b6d3d4d30d882afb64af6c74866d623ee78a39676d9da259af48435aaf6fd29aceb4da30b64b3aa7e630d841ebe6b0ba2981ae590a35bfbb6ff22cf"

export async function seedAdminUsers() {
  console.log("Seeding admin accounts...")

  const adminId = randomUUID()
  const staffId = randomUUID()

  await db.insert(adminUser).values([
    {
      id: adminId,
      name: "Admin",
      email: "admin@example.com",
      emailVerified: true,
      role: "admin",
    },
    {
      id: staffId,
      name: "Staff Member",
      email: "staff@example.com",
      emailVerified: true,
      role: "staff",
    },
  ])

  await db.insert(adminAccount).values([
    {
      id: randomUUID(),
      userId: adminId,
      accountId: adminId,
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
  ])

  return { adminId, staffId }
}
