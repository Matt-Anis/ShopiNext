"use client"

import Link from "next/link"
import type { ColumnDef } from "@tanstack/react-table"
import { ExternalLink, Eye, MoreHorizontal } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/avatar"
import { Badge } from "@repo/ui/badge"
import { Button } from "@repo/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/dropdown-menu"
import type { StaffListItem } from "@/features/staff/queries"

export type StaffMember = StaffListItem

const roleLabels: Record<string, string> = {
  owner: "Owner",
  manager: "Manager",
  staff: "Staff",
  demo: "Demo",
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

interface GetColumnsOptions {
  onView: (staff: StaffMember) => void
}

export function getColumns({
  onView,
}: GetColumnsOptions): ColumnDef<StaffMember>[] {
  return [
    {
      id: "open",
      header: "",
      enableSorting: false,
      enableHiding: false,
      meta: {
        headerClassName: "sticky left-0 bg-background z-10 w-[44px]",
        cellClassName:
          "sticky left-0 border-r bg-background z-10 w-[44px] text-center",
      },
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="icon-sm"
          nativeButton={false}
          render={<Link href={`/staff/${row.original.id}`} />}
        >
          <ExternalLink className="size-4" />
          <span className="sr-only">Open staff member</span>
        </Button>
      ),
    },
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => {
        const staff = row.original
        return (
          <div className="flex items-center gap-3">
            <Avatar size="sm">
              {staff.image && (
                <AvatarImage src={staff.image} alt={staff.name} />
              )}
              <AvatarFallback>{getInitials(staff.name)}</AvatarFallback>
            </Avatar>
            <span className="font-medium text-foreground">{staff.name}</span>
          </div>
        )
      },
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
        const label =
          roleLabels[role] ?? role.charAt(0).toUpperCase() + role.slice(1)

        return <span className="text-muted-foreground">{label}</span>
      },
    },
    {
      id: "status",
      header: "Status",
      enableSorting: false,
      cell: ({ row }) => {
        if (row.original.banned) {
          return <Badge variant="destructive">Banned</Badge>
        }
        const isVerified = row.original.emailVerified
        return (
          <Badge variant={isVerified ? "secondary" : "outline"}>
            {isVerified ? "Verified" : "Unverified"}
          </Badge>
        )
      },
    },
    {
      accessorKey: "createdAt",
      header: "Joined",
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {new Date(row.original.createdAt).toLocaleDateString(undefined, {
            dateStyle: "medium",
          })}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      enableSorting: false,
      enableHiding: false,
      meta: {
        headerClassName: "sticky right-0 bg-background",
        cellClassName: "sticky right-0 border-l bg-background",
      },
      cell: ({ row }) => {
        const staff = row.original

        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="icon-sm">
                  <MoreHorizontal />
                  <span className="sr-only">Open menu</span>
                </Button>
              }
            />
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(staff)}>
                <Eye />
                View details
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
}
