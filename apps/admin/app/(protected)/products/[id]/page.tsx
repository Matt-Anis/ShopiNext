import { notFound } from "next/navigation"

import { getProductDetail } from "@/features/products/queries"
import { ProductHeader } from "./_components/product-header"
import { ProductDescription } from "./_components/product-description"
import { ProductImages } from "./_components/product-images"
import { ProductVariants } from "./_components/product-variants"
import { ProductAtAGlance } from "./_components/product-at-a-glance"
import { ProductCategories } from "./_components/product-categories"
import { ProductHistory } from "./_components/product-history"

export default async function ProductViewPage({
  params,
}: PageProps<"/products/[id]">) {
  const { id } = await params
  const product = await getProductDetail(id)

  if (!product) {
    notFound()
  }

  return (
    <div className="px-8 py-9">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
        <div className="divide-y divide-border rounded-2xl border border-border">
          <div className="p-6">
            <ProductHeader product={product} />
          </div>
          <div className="p-6">
            <ProductDescription description={product.description} />
          </div>
          <div className="p-6">
            <ProductImages images={product.images} />
          </div>
          <div className="p-6">
            <ProductVariants
              options={product.options}
              variants={product.variants}
            />
          </div>
        </div>

        <div className="h-fit divide-y divide-border rounded-2xl border border-border lg:sticky lg:top-9">
          <div className="p-6">
            <ProductAtAGlance variants={product.variants} />
          </div>
          <div className="p-6">
            <ProductCategories
              categories={product.productCategories.map((pc) => pc.category)}
            />
          </div>
          <div className="p-6">
            <ProductHistory
              createdAt={product.createdAt}
              updatedAt={product.updatedAt}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
