"use client"

import Link from "next/link"
import type { ColumnDef } from "@tanstack/react-table"
import { Archive, ArchiveRestore, ExternalLink, Eye, MoreHorizontal } from "lucide-react"

import { Badge } from "@repo/ui/badge"
import { Button } from "@repo/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/dropdown-menu"
import { formatPrice } from "@/lib/utils"
import type { OrderListItem } from "@/features/orders/queries"
import type { OrderStatus } from "@repo/db/public/schema"

interface GetColumnsOptions {
  onView: (order: OrderListItem) => void
  onArchive: (order: OrderListItem) => void
  onUnarchive: (order: OrderListItem) => void
}

const statusVariantMap: Record<
  OrderStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  paid: "secondary",
  processing: "secondary",
  shipped: "default",
  delivered: "default",
  cancelled: "destructive",
  refunded: "outline",
}

export function getColumns({
  onView,
  onArchive,
  onUnarchive,
}: GetColumnsOptions): ColumnDef<OrderListItem>[] {
  return [
    {
      id: "open",
      header: "",
      enableSorting: false,
      enableHiding: false,
      meta: {
        headerClassName: "sticky left-0 bg-background z-10 w-[44px]",
        cellClassName: "sticky left-0 border-r bg-background z-10 w-[44px] text-center",
      },
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="icon-sm"
          render={<Link href={`/orders/${row.original.id}`} />}
        >
          <ExternalLink className="size-4" />
          <span className="sr-only">Open order</span>
        </Button>
      ),
    },
    {
      accessorKey: "id",
      header: "Order",
      cell: ({ row }) => (
        <span
          className="block max-w-[120px] truncate font-mono text-xs font-medium text-foreground"
          title={row.original.id}
        >
          {row.original.id}
        </span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Date",
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.createdAt.toLocaleString(undefined, {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </span>
      ),
    },
    {
      accessorKey: "customerEmail",
      header: "Customer",
      cell: ({ row }) => (
        <span className="font-medium text-foreground">
          {row.original.customerEmail}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status
        const label = status.charAt(0).toUpperCase() + status.slice(1)
        const variant = statusVariantMap[status] ?? "secondary"

        return <Badge variant={variant}>{label}</Badge>
      },
    },
    {
      accessorKey: "itemCount",
      header: "Items",
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.itemCount}</span>
      ),
    },
    {
      accessorKey: "totalAmount",
      header: "Total",
      cell: ({ row }) => (
        <span className="font-medium text-foreground">
          {formatPrice(row.original.totalAmount)}
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
        const order = row.original
        const isArchived = Boolean(order.archivedAt)

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
              <DropdownMenuItem onClick={() => onView(order)}>
                <Eye />
                View details
              </DropdownMenuItem>
              {isArchived ? (
                <DropdownMenuItem onClick={() => onUnarchive(order)}>
                  <ArchiveRestore />
                  Unarchive
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => onArchive(order)}
                >
                  <Archive />
                  Archive
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
}
