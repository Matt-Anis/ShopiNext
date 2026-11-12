import Link from "next/link"
import { PackageSearch } from "lucide-react"
import { Button } from "@repo/ui/button"

export default function OrderNotFound() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 px-4 py-16 text-center sm:px-6">
      <PackageSearch
        className="size-10 text-muted-foreground"
        aria-hidden="true"
      />
      <h1 className="font-heading text-3xl font-semibold">Order not found</h1>
      <p className="max-w-sm text-muted-foreground">
        We could not find that order.
      </p>
      <Button
        variant="outline"
        nativeButton={false}
        render={<Link href="/orders" />}
      >
        Back to orders
      </Button>
    </div>
  )
}
