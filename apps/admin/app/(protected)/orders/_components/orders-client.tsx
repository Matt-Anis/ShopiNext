"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Archive, ShoppingBag } from "lucide-react"

import { DataTable } from "@repo/ui/data-table"
import { ConfirmDialog } from "@repo/ui/confirm-dialog"
import { toast } from "@repo/ui/toast"
import { useBreadcrumb } from "../../_components/breadcrumb-provider"
import { usePermission } from "@/hooks/use-permission"
import { archiveOrder, unarchiveOrder } from "@/features/orders/actions"
import type { OrderListItem } from "@/features/orders/queries"
import { orderViewLabels, type OrderView } from "@/features/orders/views"
import { getColumns, renderOrderCompactRow } from "./columns"

interface OrdersClientProps {
  orders: OrderListItem[]
  isArchived?: boolean
  view?: OrderView
}

export function OrdersClient({ orders, isArchived = false, view }: OrdersClientProps) {
  useBreadcrumb(
    isArchived
      ? [{ label: "Orders", href: "/orders" }, { label: "Archived" }]
      : view
        ? [{ label: "Orders", href: "/orders" }, { label: orderViewLabels[view] }]
        : [{ label: "Orders" }]
  )

  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [archiveTarget, setArchiveTarget] = useState<OrderListItem | null>(null)
  const canUpdate = usePermission("orders", "update")

  const rowActions = {
    onView: (order: OrderListItem) => router.push(`/orders/${order.id}`),
    onArchive: setArchiveTarget,
    onUnarchive: (order: OrderListItem) => {
      startTransition(async () => {
        await toast
          .promise(unarchiveOrder(order.id), {
            loading: { title: "Unarchiving order..." },
            success: () => ({ title: "Order unarchived" }),
            error: (error: Error) => ({
              title: "Failed to unarchive order",
              description: error.message,
            }),
          })
          .catch(() => {})
      })
    },
    canUpdate,
  }

  function handleArchive() {
    if (!archiveTarget) return

    startTransition(async () => {
      await toast
        .promise(archiveOrder(archiveTarget.id), {
          loading: { title: "Archiving order..." },
          success: () => {
            setArchiveTarget(null)
            return { title: "Order archived" }
          },
          error: (error: Error) => ({
            title: "Failed to archive order",
            description: error.message,
          }),
        })
        .catch(() => {})
    })
  }

  return (
    <>
      <DataTable
        columns={getColumns(rowActions)}
        data={orders}
        renderCompactRow={(order) => renderOrderCompactRow(order, rowActions)}
        searchColumn="customerEmail"
        searchPlaceholder="Search orders by customer email..."
        emptyIcon={isArchived ? <Archive /> : <ShoppingBag />}
        emptyTitle={
          view ? "No matching orders" : isArchived ? "No archived orders" : "No orders yet"
        }
        emptyDescription={
          view
            ? "Orders that match this view will appear here."
            : isArchived
              ? "Archived orders will appear here."
              : "Orders placed by customers will appear here."
        }
        emptyTestId={isArchived ? "archived-orders-empty-state" : "orders-empty-state"}
        tableId={isArchived ? "archived-orders" : "orders"}
      />

      <ConfirmDialog
        open={archiveTarget !== null}
        onOpenChange={(open) => !open && setArchiveTarget(null)}
        title="Archive order"
        description={
          <>
            This will archive order{" "}
            <span className="font-mono font-medium text-foreground">
              {archiveTarget?.id}
            </span>
            . It will be moved to the archived orders list.
          </>
        }
        confirmLabel="Archive"
        destructive
        disabled={isPending}
        onConfirm={handleArchive}
      />
    </>
  )
}
