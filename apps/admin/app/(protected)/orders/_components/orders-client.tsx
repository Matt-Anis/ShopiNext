"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Archive, ShoppingBag } from "lucide-react"

import { DataTable } from "@repo/ui/data-table"
import { ConfirmDialog } from "@repo/ui/confirm-dialog"
import { toast } from "@repo/ui/toast"
import { useBreadcrumb } from "../../_components/breadcrumb-provider"
import { archiveOrder, unarchiveOrder } from "@/features/orders/actions"
import type { OrderListItem } from "@/features/orders/queries"
import { getColumns } from "./columns"

interface OrdersClientProps {
  orders: OrderListItem[]
  isArchived?: boolean
}

export function OrdersClient({ orders, isArchived = false }: OrdersClientProps) {
  useBreadcrumb(
    isArchived
      ? [{ label: "Orders", href: "/orders" }, { label: "Archived" }]
      : [{ label: "Orders" }]
  )

  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [archiveTarget, setArchiveTarget] = useState<OrderListItem | null>(null)

  const columns = getColumns({
    onView: (order) => router.push(`/orders/${order.id}`),
    onArchive: (order) => setArchiveTarget(order),
    onUnarchive: (order) => {
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
  })

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
        columns={columns}
        data={orders}
        searchColumn="customerEmail"
        searchPlaceholder="Search orders by customer email..."
        emptyIcon={isArchived ? <Archive /> : <ShoppingBag />}
        emptyTitle={isArchived ? "No archived orders" : "No orders yet"}
        emptyDescription={
          isArchived
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
