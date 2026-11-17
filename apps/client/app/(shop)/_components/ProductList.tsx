"use client"

import type { ReactNode } from "react"
import { Button } from "@repo/ui/button"
import { ProductCard, ProductCardSkeleton } from "@/components/ProductCard"
import type { Product, ProductCursor } from "@/features/products/queries"
import { useProductPagination } from "@/features/products/use-product-pagination"
import {
  productDiscoveryKey,
  type ProductSortBy,
} from "@/features/products/discovery"

const SKELETON_COUNT = 8

type ProductListProps = {
  initialProducts: Product[]
  initialCursor: ProductCursor | null
  categoryId?: string
  query?: string
  sortBy?: ProductSortBy
  title?: string | null
  className?: string
  emptyState?: ReactNode
  isUpdating?: boolean
}

export default function ProductList(props: ProductListProps) {
  const { query = "", sortBy = "newest", categoryId } = props
  return (
    <ProductListResults
      key={productDiscoveryKey({ query, sortBy }, categoryId)}
      {...props}
    />
  )
}

function ProductListResults({
  initialProducts,
  initialCursor,
  categoryId,
  query = "",
  sortBy = "newest",
  title = "Our products",
  className,
  emptyState,
  isUpdating = false,
}: ProductListProps) {
  const { products, hasMore, sentinelRef, isPending, error, loadMore } =
    useProductPagination({
      initialProducts,
      initialCursor,
      categoryId,
      query,
      sortBy,
      enabled: !isUpdating,
    })

  return (
    <section
      className={className ?? "storefront-container py-12 md:py-20"}
      id="products"
      aria-busy={isUpdating || isPending}
    >
      {title && <h2 className="mb-8 section-heading">{title}</h2>}
      {products.length === 0 && !isUpdating ? (
        emptyState
      ) : (
        <div
          className="grid grid-cols-1 gap-x-4 gap-y-8 min-[480px]:grid-cols-2 sm:gap-x-6 lg:grid-cols-3 lg:gap-x-8 lg:gap-y-12"
          data-testid={isUpdating ? "product-list-skeleton" : undefined}
          aria-hidden={isUpdating || undefined}
        >
          {!isUpdating &&
            products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          {(isUpdating || isPending) &&
            Array.from({ length: SKELETON_COUNT }).map((_, i) => (
              <ProductCardSkeleton key={`skeleton-${i}`} />
            ))}
        </div>
      )}
      {(isUpdating || isPending) && (
        <p role="status" className="sr-only">
          Loading products…
        </p>
      )}
      {error && !isUpdating && (
        <div
          role="alert"
          className="mt-6 flex flex-col items-center gap-3 text-center"
        >
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button
            type="button"
            variant="outline"
            onClick={loadMore}
            disabled={isPending}
          >
            Retry
          </Button>
        </div>
      )}
      {hasMore && !error && !isUpdating && (
        <div
          ref={sentinelRef}
          data-testid="product-pagination-sentinel"
          className="h-1"
        />
      )}
    </section>
  )
}
