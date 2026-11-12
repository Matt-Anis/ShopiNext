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
      className="border border-dashed border-border py-16"
      data-testid="orders-empty-state"
    >
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Package />
        </EmptyMedia>
        <EmptyTitle>
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
