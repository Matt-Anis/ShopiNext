"use client"

import * as React from "react"
import { Archive, ArchiveRestore, RefreshCw } from "lucide-react"

import { Badge } from "@repo/ui/badge"
import { Button } from "@repo/ui/button"
import { useBreadcrumb } from "../../../_components/breadcrumb-provider"
import { archiveOrder, unarchiveOrder } from "@/features/orders/actions"
import { OrderStatusDialog } from "./order-status-dialog"
import type { OrderStatus } from "@repo/db/public/schema"

interface OrderHeaderProps {
  order: {
    id: string
    status: OrderStatus
    createdAt: Date
    checkoutEmail: string
    archivedAt: Date | null
  }
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

export function OrderHeader({ order }: OrderHeaderProps) {
  const [statusDialogOpen, setStatusDialogOpen] = React.useState(false)
  const [isPending, startTransition] = React.useTransition()

  useBreadcrumb([
    { label: "Orders", href: "/orders" },
    { label: `Order #${order.id.slice(0, 8)}` },
  ])

  function handleToggleArchive() {
    startTransition(async () => {
      if (order.archivedAt) {
        await unarchiveOrder(order.id)
      } else {
        await archiveOrder(order.id)
      }
    })
  }

  const statusLabel =
    order.status.charAt(0).toUpperCase() + order.status.slice(1)
  const isArchived = Boolean(order.archivedAt)

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              Order #{order.id.slice(0, 8)}
            </h1>
            <Badge variant={statusVariantMap[order.status] ?? "secondary"}>
              {statusLabel}
            </Badge>
            {isArchived && <Badge variant="outline">Archived</Badge>}
          </div>
          <p className="text-sm text-muted-foreground">
            Placed on{" "}
            {order.createdAt.toLocaleString(undefined, {
              dateStyle: "medium",
              timeStyle: "short",
            })}{" "}
            by {order.checkoutEmail}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            disabled={isPending}
            onClick={() => setStatusDialogOpen(true)}
          >
            <RefreshCw />
            Update Status
          </Button>

          <Button
            variant={isArchived ? "secondary" : "outline"}
            disabled={isPending}
            onClick={handleToggleArchive}
          >
            {isArchived ? (
              <>
                <ArchiveRestore />
                Unarchive
              </>
            ) : (
              <>
                <Archive />
                Archive
              </>
            )}
          </Button>
        </div>
      </div>

      <OrderStatusDialog
        open={statusDialogOpen}
        onOpenChange={setStatusDialogOpen}
        orderId={order.id}
        currentStatus={order.status}
      />
    </>
  )
}
