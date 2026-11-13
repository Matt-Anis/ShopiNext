import Link from "next/link"
import { Button } from "@repo/ui/button"
import { ordersPageHref } from "@/features/orders/pagination"

export function OrderPagination({
  page,
  totalPages,
}: {
  page: number
  totalPages: number
}) {
  if (totalPages <= 1) return null

  return (
    <nav
      aria-label="Order history pagination"
      className="mt-8 flex items-center justify-between gap-3"
    >
      {page > 1 ? (
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href={ordersPageHref(page - 1)} />}
        >
          Previous
        </Button>
      ) : (
        <Button variant="outline" disabled>
          Previous
        </Button>
      )}
      <p className="text-sm text-muted-foreground" aria-live="polite">
        Page {page} of {totalPages}
      </p>
      {page < totalPages ? (
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href={ordersPageHref(page + 1)} />}
        >
          Next
        </Button>
      ) : (
        <Button variant="outline" disabled>
          Next
        </Button>
      )}
    </nav>
  )
}
