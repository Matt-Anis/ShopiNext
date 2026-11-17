"use client"

import { CatalogControls } from "@repo/ui/catalog-controls"
import {
  MAX_PRODUCT_QUERY_LENGTH,
  PRODUCT_SORT_OPTIONS,
  type ProductDiscovery,
} from "../discovery"
import { useProductDiscovery } from "../use-product-discovery"

export function ProductDiscoveryControls({ discovery }: { discovery: ProductDiscovery }) {
  const controls = useProductDiscovery(discovery)

  return (
    <CatalogControls
      query={controls.query}
      sortBy={discovery.sortBy}
      sortOptions={PRODUCT_SORT_OPTIONS}
      maxQueryLength={MAX_PRODUCT_QUERY_LENGTH}
      onQueryChange={controls.setQuery}
      onSortChange={controls.changeSort}
      onReset={controls.reset}
      busy={controls.isUpdating}
      canReset={controls.canReset}
    />
  )
}
