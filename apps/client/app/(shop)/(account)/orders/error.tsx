"use client"

import { AlertCircle } from "lucide-react"
import { Button } from "@repo/ui/button"

export default function OrdersError({ retry }: { retry: () => void }) {
  return (
    <div
      className="flex flex-col items-center gap-4 py-16 text-center"
      role="alert"
    >
      <AlertCircle
        className="size-10 text-muted-foreground"
        aria-hidden="true"
      />
      <h2 className="font-heading text-2xl font-semibold">
        Unable to load your orders
      </h2>
      <p className="max-w-sm text-muted-foreground">
        Please try again in a moment.
      </p>
      <Button onClick={retry}>Try again</Button>
    </div>
  )
}
