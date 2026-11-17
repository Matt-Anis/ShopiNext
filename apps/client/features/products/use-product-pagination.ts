"use client"

import { useCallback, useEffect, useRef, useState, useTransition } from "react"
import { useInView } from "react-intersection-observer"
import { loadMoreProducts } from "./actions"
import type { ProductDiscovery } from "./discovery"
import type { Product, ProductCursor } from "./queries"

type ProductPaginationOptions = ProductDiscovery & {
  initialProducts: Product[]
  initialCursor: ProductCursor | null
  categoryId?: string
  enabled?: boolean
}

export function useProductPagination({
  initialProducts,
  initialCursor,
  categoryId,
  query,
  sortBy,
  enabled = true,
}: ProductPaginationOptions) {
  const [products, setProducts] = useState(initialProducts)
  const [cursor, setCursor] = useState(initialCursor)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const fetchingRef = useRef(false)
  const mountedRef = useRef(true)
  const { ref: sentinelRef, inView } = useInView({ rootMargin: "400px" })

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  const loadMore = useCallback(() => {
    if (!enabled || !cursor || fetchingRef.current) return

    fetchingRef.current = true
    startTransition(async () => {
      try {
        const next = await loadMoreProducts(cursor, { categoryId, query, sortBy })
        if (!mountedRef.current) return

        setProducts((previous) => [...previous, ...next.products])
        setCursor(next.nextCursor)
        setError(null)
      } catch {
        if (mountedRef.current) {
          setError("We couldn't load more products. Please try again.")
        }
      } finally {
        fetchingRef.current = false
      }
    })
  }, [cursor, categoryId, query, sortBy, enabled])

  useEffect(() => {
    if (enabled && inView && !error) loadMore()
  }, [enabled, inView, error, loadMore])

  return { products, hasMore: cursor !== null, sentinelRef, isPending, error, loadMore }
}
