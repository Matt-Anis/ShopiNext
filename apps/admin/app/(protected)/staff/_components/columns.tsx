"use client"

import type { ColumnDef } from "@tanstack/react-table"

import type { auth } from "@/lib/auth"
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/avatar"
import { Badge } from "@repo/ui/badge"

export type StaffMember = Awaited<
  ReturnType<typeof auth.api.listUsers>
>["users"][number]

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
      cell: ({ row }) => (
        <Badge variant={row.original.role === "admin" ? "default" : "secondary"}>
          {row.original.role === "admin" ? "Root" : "Staff"}
        </Badge>
      ),
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
