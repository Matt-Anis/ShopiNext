"use client"

import { CatalogControls } from "@repo/ui/catalog-controls"
import {
  MAX_PRODUCT_QUERY_LENGTH,
  PRODUCT_SORT_OPTIONS,
  type ProductDiscovery,
} from "../discovery"
import type { useProductDiscovery } from "../use-product-discovery"

export function ProductDiscoveryControls({ discovery, controls }: {
  discovery: ProductDiscovery
  controls: ReturnType<typeof useProductDiscovery>
}) {
  return (
    <CatalogControls
      query={controls.query}
      sortBy={discovery.sortBy}
      sortOptions={PRODUCT_SORT_OPTIONS}
      maxQueryLength={MAX_PRODUCT_QUERY_LENGTH}
      onQueryChange={controls.setQuery}
      onSortChange={controls.changeSort}
      onReset={controls.reset}
      canReset={controls.canReset}
    />
  )
}
