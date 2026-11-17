import Link from "next/link"
import { PackageOpen } from "lucide-react"
import { buttonVariants } from "@repo/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia } from "@repo/ui/empty"
import { productDiscoveryHref, type ProductDiscovery } from "../discovery"

type ProductEmptyStateProps = {
  discovery: ProductDiscovery
  pathname: string
  category?: boolean
}

export function ProductEmptyState({ discovery, pathname, category = false }: ProductEmptyStateProps) {
  const filtered = discovery.query !== ""

  return (
    <Empty className="rounded-3xl border border-dashed border-border bg-muted/20 px-6 py-16">
      <EmptyHeader>
        <EmptyMedia><PackageOpen className="size-10 text-muted-foreground" /></EmptyMedia>
        <h2 className="font-heading text-lg font-medium">
          {filtered ? "No matching products" : "No products found"}
        </h2>
        <EmptyDescription>
          {filtered
            ? `No products match “${discovery.query}”${category ? " in this category" : ""}. Try another name or clear the filter.`
            : category
              ? "There are no products in this category right now. Check back soon!"
              : "There are no products available right now. Check back soon!"}
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        {filtered ? (
          <Link
            href={productDiscoveryHref(pathname, { ...discovery, query: "" })}
            scroll={false}
            className={buttonVariants({ variant: "outline" })}
          >
            Clear name filter
          </Link>
        ) : (
          <Link href="/categories" className={buttonVariants({ variant: "outline" })}>
            Browse other categories
          </Link>
        )}
      </EmptyContent>
    </Empty>
  )
}
