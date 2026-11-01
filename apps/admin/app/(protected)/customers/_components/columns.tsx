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
import { formatPrice } from "@/lib/utils"
import { formatProvider } from "@/features/customers/utils"
import type { CustomerListItem } from "@/features/customers/queries"

interface GetColumnsOptions {
  onView: (customer: CustomerListItem) => void
}

export function getColumns({
  onView,
}: GetColumnsOptions): ColumnDef<CustomerListItem>[] {
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
          render={<Link href={`/customers/${row.original.id}`} />}
        >
          <ExternalLink className="size-4" />
          <span className="sr-only">Open customer</span>
        </Button>
      ),
    },
    {
      accessorKey: "name",
      header: "Customer",
      cell: ({ row }) => {
        const customer = row.original
        const initial = customer.name
          ? customer.name.charAt(0).toUpperCase()
          : "C"

        return (
          <div className="flex items-center gap-3">
            <Avatar size="sm">
              {customer.image && (
                <AvatarImage src={customer.image} alt={customer.name} />
              )}
              <AvatarFallback>{initial}</AvatarFallback>
            </Avatar>
            <span className="font-medium text-foreground">
              {customer.name || customer.email}
            </span>
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
      accessorKey: "emailVerified",
      header: "Status",
      cell: ({ row }) => {
        const isVerified = row.original.emailVerified
        return (
          <Badge variant={isVerified ? "secondary" : "outline"}>
            {isVerified ? "Verified" : "Unverified"}
          </Badge>
        )
      },
    },
    {
      accessorKey: "providers",
      header: "Auth",
      cell: ({ row }) => {
        const providers = row.original.providers
        if (!providers || providers.length === 0) {
          return <span className="text-xs text-muted-foreground">—</span>
        }
        return (
          <div className="flex flex-wrap gap-1">
            {providers.map((p) => (
              <Badge key={p} variant="outline" className="text-xs">
                {formatProvider(p)}
              </Badge>
            ))}
          </div>
        )
      },
    },
    {
      accessorKey: "totalOrders",
      header: "Orders",
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.totalOrders}
        </span>
      ),
    },
    {
      accessorKey: "totalSpent",
      header: "Lifetime Spend",
      cell: ({ row }) => (
        <span className="font-medium text-foreground">
          {formatPrice(row.original.totalSpent)}
        </span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Joined",
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.createdAt.toLocaleDateString(undefined, {
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
        const customer = row.original

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
              <DropdownMenuItem onClick={() => onView(customer)}>
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
