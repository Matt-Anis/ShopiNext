"use client"

import type { ReactNode } from "react"
import { ProductDiscoveryControls } from "@/features/products/components/product-discovery-controls"
import type { ProductDiscovery } from "@/features/products/discovery"
import type { Product, ProductCursor } from "@/features/products/queries"
import { useProductDiscovery } from "@/features/products/use-product-discovery"
import ProductList from "./ProductList"

type ProductCatalogProps = {
  discovery: ProductDiscovery
  initialProducts: Product[]
  initialCursor: ProductCursor | null
  categoryId?: string
  emptyState?: ReactNode
}

export default function ProductCatalog({ discovery, ...listing }: ProductCatalogProps) {
  const controls = useProductDiscovery(discovery)

  return (
    <>
      <ProductDiscoveryControls discovery={discovery} controls={controls} />
      <ProductList
        {...listing}
        {...discovery}
        isUpdating={controls.isUpdating}
        title={null}
        className="p-0"
      />
    </>
  )
}
