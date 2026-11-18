"use client"

import Link from "next/link"
import type { ColumnDef } from "@tanstack/react-table"
import { Archive, ArchiveRestore, ExternalLink, Eye, MoreHorizontal } from "lucide-react"

import { Button } from "@repo/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/dropdown-menu"
import { formatPrice } from "@/lib/utils"
import type { OrderListItem } from "@/features/orders/queries"
import { OrderStatusBadge } from "./order-status-badge"

interface GetColumnsOptions {
  onView: (order: OrderListItem) => void
  onArchive: (order: OrderListItem) => void
  onUnarchive: (order: OrderListItem) => void
  canUpdate: boolean
}

function renderOrderActions(
  order: OrderListItem,
  { onView, onArchive, onUnarchive }: GetColumnsOptions,
  compact = false
) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon-sm" className={compact ? "size-11" : undefined}>
            <MoreHorizontal aria-hidden="true" />
            <span className="sr-only">Open menu</span>
          </Button>
        }
      />
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onView(order)}>
          <Eye />
          View details
        </DropdownMenuItem>
        {order.archivedAt ? (
          <DropdownMenuItem onClick={() => onUnarchive(order)}>
            <ArchiveRestore />
            Unarchive
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem variant="destructive" onClick={() => onArchive(order)}>
            <Archive />
            Archive
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function renderOrderCompactRow(order: OrderListItem, actions: GetColumnsOptions) {
  const orderNumber = order.id.slice(0, 8)

  return (
    <div className="flex min-w-0 items-center gap-1 px-3 py-1">
      <Link
        href={`/orders/${order.id}`}
        aria-label={`Open order ${orderNumber}`}
        className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-1 py-2.5 outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-sm font-semibold" title={order.id}>Order {orderNumber}</span>
            <OrderStatusBadge status={order.status} />
          </div>
          <p className="mt-1 truncate text-xs text-muted-foreground" title={order.customerEmail}>
            {order.customerEmail}
          </p>
          <div className="mt-1 flex flex-wrap items-baseline gap-x-2">
            <span className="text-sm font-medium tabular-nums">{formatPrice(order.totalAmount)}</span>
            <time dateTime={order.createdAt.toISOString()} className="text-xs text-muted-foreground" suppressHydrationWarning>
              {order.createdAt.toLocaleDateString(undefined, { dateStyle: "medium" })}
            </time>
          </div>
        </div>
        {!actions.canUpdate && (
          <span className="grid size-11 shrink-0 place-items-center text-muted-foreground">
            <ExternalLink aria-hidden="true" className="size-4" />
          </span>
        )}
      </Link>
      {actions.canUpdate && renderOrderActions(order, actions, true)}
    </div>
  )
}

export function getColumns(actions: GetColumnsOptions): ColumnDef<OrderListItem>[] {
  const columns: ColumnDef<OrderListItem>[] = [
    {
      id: "open",
      header: "",
      enableSorting: false,
      enableHiding: false,
      meta: {
        headerClassName: "sticky left-0 bg-card z-10 w-[44px]",
        cellClassName: "sticky left-0 border-r bg-card z-10 w-[44px] text-center",
      },
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="icon-sm"
          nativeButton={false}
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
      cell: ({ row }) => <OrderStatusBadge status={row.original.status} />,
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
  ]

  if (actions.canUpdate) {
    columns.push({
      id: "actions",
      header: "",
      enableSorting: false,
      enableHiding: false,
      meta: {
        headerClassName: "sticky right-0 bg-card",
        cellClassName: "sticky right-0 border-l bg-card",
      },
      cell: ({ row }) => renderOrderActions(row.original, actions),
    })
  }

  return columns
}
