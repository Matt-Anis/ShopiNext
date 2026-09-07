import { notFound } from "next/navigation"

import { getProductDetail } from "@/features/products/queries"
import { ProductHeader } from "./_components/product-header"
import { ProductImages } from "./_components/product-images"
import { ProductCategories } from "./_components/product-categories"
import { ProductOptions } from "./_components/product-options"
import { ProductVariants } from "./_components/product-variants"

export default async function ProductViewPage({
  params,
}: PageProps<"/products/[id]">) {
  const { id } = await params
  const product = await getProductDetail(id)

  if (!product) {
    notFound()
  }

  return (
    <div className="flex flex-col gap-8 px-8 py-9">
      <ProductHeader product={product} />
      <ProductImages images={product.images} />
      <ProductCategories
        categories={product.productCategories.map((pc) => pc.category)}
      />
      <ProductOptions options={product.options} />
      <ProductVariants options={product.options} variants={product.variants} />
    </div>
  )
}
