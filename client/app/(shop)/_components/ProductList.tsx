"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useInView } from "react-intersection-observer";
import { ProductCard, ProductCardSkeleton } from "@/components/ProductCard";
import type { Product, ProductCursor } from "@/db/queries";
import { loadMoreProducts } from "@/actions";

const SKELETON_COUNT = 8;

export default function ProductList({
  initialProducts,
  initialCursor,
}: {
  initialProducts: Product[];
  initialCursor: ProductCursor | null;
}) {
  const [products, setProducts] = useState(initialProducts);
  const [cursor, setCursor] = useState(initialCursor);
  const [isPending, startTransition] = useTransition();
  const isFetchingRef = useRef(false);
  const { ref: sentinelRef, inView } = useInView({ rootMargin: "400px" });

  useEffect(() => {
    if (!inView || !cursor || isFetchingRef.current) return;

    isFetchingRef.current = true;
    startTransition(async () => {
      const { products: nextProducts, nextCursor } =
        await loadMoreProducts(cursor);
      setProducts((prev) => [...prev, ...nextProducts]);
      setCursor(nextCursor);
      isFetchingRef.current = false;
    });
  }, [inView, cursor]);

  return (
    <section className="px-6 py-16 md:px-10" id="products">
      <h2 className="mb-8 text-center text-4xl font-semibold">Our products</h2>
      <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 max-w-7xl mx-auto justify-center">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
        {isPending &&
          Array.from({ length: SKELETON_COUNT }).map((_, i) => (
            <ProductCardSkeleton key={`skeleton-${i}`} />
          ))}
      </div>
      {cursor && <div ref={sentinelRef} className="h-1" />}
    </section>
  );
}
