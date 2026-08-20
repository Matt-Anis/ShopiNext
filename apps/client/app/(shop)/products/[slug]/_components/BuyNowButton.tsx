"use client"

import { useRef, useState } from "react"

import { Button } from "@repo/ui/button"
import { StripeCheckoutDialog } from "@/app/(shop)/_components/StripeCheckoutDialog"
import { checkoutNow } from "@/features/checkout/actions"

export function BuyNowButton({
  productId,
  className,
}: {
  productId: string
  className?: string
}) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  return (
    <>
      <form ref={formRef} action={checkoutNow.bind(null, productId, 1)}>
        <Button
          type="button"
          size="lg"
          className={className}
          onClick={() => setDialogOpen(true)}
          data-testid="buy-now-button"
        >
          Buy now
        </Button>
      </form>
      <StripeCheckoutDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onConfirm={() => formRef.current?.requestSubmit()}
      />
    </>
  )
}
