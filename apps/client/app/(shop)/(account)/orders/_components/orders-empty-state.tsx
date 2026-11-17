import Link from "next/link"
import { Package } from "lucide-react"
import { Button } from "@repo/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@repo/ui/empty"

export function OrdersEmptyState() {
  return (
    <Empty
      className="rounded-lg border border-dashed border-border bg-muted/40 py-20"
      data-testid="orders-empty-state"
    >
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Package />
        </EmptyMedia>
        <EmptyTitle className="font-heading text-2xl font-bold tracking-tight">
          <h2>No orders yet</h2>
        </EmptyTitle>
        <EmptyDescription>
          Your purchases will appear here once you place an order.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button nativeButton={false} render={<Link href="/" />}>
          Browse products
        </Button>
      </EmptyContent>
    </Empty>
  )
}
