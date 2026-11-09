import { desc, eq } from "drizzle-orm"

import { db } from "@/db"
import { adminUser } from "@repo/db/admin/auth-schema"

export type StaffListItem = {
  id: string
  name: string
  email: string
  emailVerified: boolean
  image: string | null
  role: string | null
  banned: boolean
  banReason: string | null
  banExpires: Date | null
  createdAt: Date
  updatedAt: Date
}

export type StaffSessionItem = {
  id: string
  ipAddress: string | null
  userAgent: string | null
  expiresAt: Date
  createdAt: Date
  impersonatedBy: string | null
}

export type StaffAccountItem = {
  id: string
  providerId: string
  createdAt: Date
}

export type StaffDetails = {
  id: string
  name: string
  email: string
  emailVerified: boolean
  image: string | null
  role: string | null
  banned: boolean
  banReason: string | null
  banExpires: Date | null
  createdAt: Date
  updatedAt: Date
  providers: StaffAccountItem[]
  sessions: StaffSessionItem[]
}

export async function getStaffList(): Promise<StaffListItem[]> {
  const rows = await db
    .select({
      id: adminUser.id,
      name: adminUser.name,
      email: adminUser.email,
      emailVerified: adminUser.emailVerified,
      image: adminUser.image,
      role: adminUser.role,
      banned: adminUser.banned,
      banReason: adminUser.banReason,
      banExpires: adminUser.banExpires,
      createdAt: adminUser.createdAt,
      updatedAt: adminUser.updatedAt,
    })
    .from(adminUser)
    .orderBy(desc(adminUser.createdAt))

  return rows.map((row) => ({
    ...row,
    banned: Boolean(row.banned),
  }))
}

export async function getStaffById(id: string): Promise<StaffDetails | null> {
  const staffMember = await db.query.adminUser.findFirst({
    where: eq(adminUser.id, id),
    columns: {
      id: true,
      name: true,
      email: true,
      emailVerified: true,
      image: true,
      role: true,
      banned: true,
      banReason: true,
      banExpires: true,
      createdAt: true,
      updatedAt: true,
    },
    with: {
      adminAccounts: {
        columns: {
          id: true,
          providerId: true,
          createdAt: true,
        },
      },
      adminSessions: {
        columns: {
          id: true,
          ipAddress: true,
          userAgent: true,
          expiresAt: true,
          createdAt: true,
          impersonatedBy: true,
        },
        orderBy: (sessionTable, { desc: descOrder }) => [
          descOrder(sessionTable.createdAt),
        ],
      },
    },
  })

  if (!staffMember) {
    return null
  }

  return {
    id: staffMember.id,
    name: staffMember.name,
    email: staffMember.email,
    emailVerified: staffMember.emailVerified,
    image: staffMember.image,
    role: staffMember.role,
    banned: Boolean(staffMember.banned),
    banReason: staffMember.banReason,
    banExpires: staffMember.banExpires,
    createdAt: staffMember.createdAt,
    updatedAt: staffMember.updatedAt,
    providers: staffMember.adminAccounts,
    sessions: staffMember.adminSessions,
  }
}
