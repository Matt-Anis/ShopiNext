"use client";

import type { ReactNode } from "react";
import { Button } from "@repo/ui/button";
import { ProductCard, ProductCardSkeleton } from "@/components/ProductCard";
import type { Product, ProductCursor } from "@/features/products/queries";
import { useProductPagination } from "@/features/products/use-product-pagination";
import { productDiscoveryKey, type ProductSortBy } from "@/features/products/discovery";

const SKELETON_COUNT = 8;

type ProductListProps = {
  initialProducts: Product[];
  initialCursor: ProductCursor | null;
  categoryId?: string;
  query?: string;
  sortBy?: ProductSortBy;
  title?: string | null;
  className?: string;
  emptyState?: ReactNode;
};

export default function ProductList(props: ProductListProps) {
  const { query = "", sortBy = "newest", categoryId } = props;
  return (
    <ProductListResults
      key={productDiscoveryKey({ query, sortBy }, categoryId)}
      {...props}
    />
  );
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
}: ProductListProps) {
  const { products, hasMore, sentinelRef, isPending, error, loadMore } =
    useProductPagination({ initialProducts, initialCursor, categoryId, query, sortBy });

  return (
    <section className={className ?? "px-6 py-16 md:px-10"} id="products" aria-busy={isPending}>
      {title && (
        <h2 className="mb-8 text-center text-4xl font-semibold">{title}</h2>
      )}
      {products.length === 0 ? emptyState : <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 max-w-7xl mx-auto justify-center">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
        {isPending &&
          Array.from({ length: SKELETON_COUNT }).map((_, i) => (
            <ProductCardSkeleton key={`skeleton-${i}`} />
          ))}
      </div>}
      {isPending && <p role="status" className="mt-6 text-center text-sm text-muted-foreground">Loading more products…</p>}
      {error && (
        <div role="alert" className="mt-6 flex flex-col items-center gap-3 text-center">
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button type="button" variant="outline" onClick={loadMore} disabled={isPending}>
            Retry
          </Button>
        </div>
      )}
      {hasMore && !error && <div ref={sentinelRef} data-testid="product-pagination-sentinel" className="h-1" />}
    </section>
  );
}
