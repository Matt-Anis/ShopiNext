"use client"

import type { ColumnDef } from "@tanstack/react-table"

import type { auth } from "@/lib/auth"
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/avatar"
import { Badge } from "@repo/ui/badge"

export type StaffMember = Awaited<
  ReturnType<typeof auth.api.listUsers>
>["users"][number]

const roleBadgeConfig: Record<
  string,
  { label: string; variant: "default" | "secondary" | "outline" }
> = {
  owner: { label: "Owner", variant: "default" },
  admin: { label: "Owner", variant: "default" },
  manager: { label: "Manager", variant: "secondary" },
  staff: { label: "Staff", variant: "secondary" },
  demo: { label: "Demo", variant: "outline" },
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

export function getColumns(): ColumnDef<StaffMember>[] {
  return [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.name}</span>
      ),
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.email}</span>
      ),
    },
    {
      accessorKey: "role",
      header: "Role",
      enableSorting: false,
      cell: ({ row }) => {
        const role = row.original.role ?? "staff"
        const config = roleBadgeConfig[role] ?? {
          label: role.charAt(0).toUpperCase() + role.slice(1),
          variant: "secondary" as const,
        }

        return <Badge variant={config.variant}>{config.label}</Badge>
      },
    },
    {
      id: "image",
      header: "Pic",
      enableSorting: false,
      cell: ({ row }) => (
        <Avatar>
          <AvatarImage
            src={row.original.image ?? undefined}
            alt={row.original.name}
          />
          <AvatarFallback>{getInitials(row.original.name)}</AvatarFallback>
        </Avatar>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Joined",
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {new Date(row.original.createdAt).toLocaleDateString()}
        </span>
      ),
    },
  ]
}
