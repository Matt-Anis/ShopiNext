"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"

import { Button } from "@repo/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/dialog"
import { Label } from "@repo/ui/label"
import { Textarea } from "@repo/ui/textarea"
import { cn } from "@repo/ui/utils"
import { updateOrderStatus } from "@/features/orders/actions"
import type { OrderStatus } from "@repo/db/public/schema"

interface OrderStatusDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  orderId: string
  currentStatus: OrderStatus
}

interface OrderStatusFormProps {
  orderId: string
  currentStatus: OrderStatus
  onClose: () => void
}

const ORDER_STATUSES: {
  value: OrderStatus
  label: string
  description: string
}[] = [
  { value: "paid", label: "Paid", description: "Payment has been received." },
  {
    value: "processing",
    label: "Processing",
    description: "Order is being prepared or packed.",
  },
  {
    value: "shipped",
    label: "Shipped",
    description: "Order has been dispatched with carrier.",
  },
  {
    value: "delivered",
    label: "Delivered",
    description: "Package was delivered to the customer.",
  },
  {
    value: "cancelled",
    label: "Cancelled",
    description: "Order was cancelled.",
  },
  {
    value: "refunded",
    label: "Refunded",
    description: "Payment has been refunded.",
  },
]

function OrderStatusForm({
  orderId,
  currentStatus,
  onClose,
}: OrderStatusFormProps) {
  const [selectedStatus, setSelectedStatus] =
    React.useState<OrderStatus>(currentStatus)
  const [note, setNote] = React.useState("")
  const [isPending, startTransition] = React.useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      await updateOrderStatus(orderId, selectedStatus, note)
      onClose()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label className="text-xs font-semibold text-muted-foreground uppercase">
            New Status
          </Label>
          <div className="grid grid-cols-2 gap-2">
            {ORDER_STATUSES.map((status) => {
              const isSelected = selectedStatus === status.value
              const isCurrent = currentStatus === status.value
              return (
                <button
                  key={status.value}
                  type="button"
                  disabled={isPending}
                  onClick={() => setSelectedStatus(status.value)}
                  className={cn(
                    "flex flex-col items-start rounded-xl border p-3 text-left transition-colors",
                    isSelected
                      ? "border-primary bg-primary/5 text-foreground"
                      : "border-border hover:bg-muted/50 text-muted-foreground",
                    isCurrent && "ring-1 ring-border"
                  )}
                >
                  <div className="flex items-center gap-1.5 font-medium text-foreground">
                    {status.label}
                    {isCurrent && (
                      <span className="text-[10px] text-muted-foreground">
                        (Current)
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground line-clamp-1">
                    {status.description}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="timeline-note">Timeline Note (Optional)</Label>
          <Textarea
            id="timeline-note"
            placeholder="e.g. Tracking number provided: 1Z9999999999999999"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            disabled={isPending}
            rows={3}
          />
        </div>
      </div>

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={onClose}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isPending || selectedStatus === currentStatus}
        >
          {isPending && <Loader2 className="animate-spin" />}
          Save Status
        </Button>
      </DialogFooter>
    </form>
  )
}

export function OrderStatusDialog({
  open,
  onOpenChange,
  orderId,
  currentStatus,
}: OrderStatusDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update Order Status</DialogTitle>
          <DialogDescription>
            Transition the order lifecycle state and optionally record a public
            timeline note.
          </DialogDescription>
        </DialogHeader>

        {open && (
          <OrderStatusForm
            orderId={orderId}
            currentStatus={currentStatus}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
