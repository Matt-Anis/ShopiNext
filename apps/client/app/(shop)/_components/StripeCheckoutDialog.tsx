"use client"

import { CreditCard, Minus, Plus } from "lucide-react"

import { Button } from "@repo/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@repo/ui/alert-dialog"

export function StripeCheckoutDialog({
  open,
  onOpenChange,
  onConfirm,
  quantity,
  onQuantityChange,
  maxQuantity,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  quantity?: number
  onQuantityChange?: (quantity: number) => void
  maxQuantity?: number
}) {
  const showQuantityPicker =
    quantity !== undefined &&
    onQuantityChange !== undefined &&
    maxQuantity !== undefined

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogMedia>
            <CreditCard />
          </AlertDialogMedia>
          <AlertDialogTitle>Redirecting to Stripe</AlertDialogTitle>
          <AlertDialogDescription>
            You&apos;ll be redirected to Stripe&apos;s secure checkout to
            complete your payment.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {showQuantityPicker && (
          <div className="flex items-center justify-between rounded-4xl border border-border p-1">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
              data-testid="stripe-checkout-quantity-decrement"
            >
              <Minus className="size-4" />
            </Button>
            <span
              className="text-sm font-medium"
              data-testid="stripe-checkout-quantity"
            >
              {quantity}
            </span>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() =>
                onQuantityChange(Math.min(maxQuantity, quantity + 1))
              }
              disabled={quantity >= maxQuantity}
              data-testid="stripe-checkout-quantity-increment"
            >
              <Plus className="size-4" />
            </Button>
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel data-testid="stripe-checkout-cancel">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            data-testid="stripe-checkout-confirm"
          >
            Continue
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
