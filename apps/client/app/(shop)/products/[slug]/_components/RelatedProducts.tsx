import { ProductCard } from "@/components/ProductCard"
import { getRelatedProducts } from "@/features/products/related-products"

export default async function RelatedProducts({
  productId,
  categoryIds,
}: {
  productId: string
  categoryIds: string[]
}) {
  const products = await getRelatedProducts({ productId, categoryIds })

  if (products.length === 0) return null

  return (
    <section
      aria-labelledby="related-products-heading"
      className="storefront-container border-t border-border py-12 md:py-20"
    >
      <h2 id="related-products-heading" className="mb-8 section-heading">
        Related products
      </h2>
      <div className="grid grid-cols-1 gap-x-4 gap-y-8 min-[480px]:grid-cols-2 sm:gap-x-6 lg:grid-cols-3 lg:gap-8">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  )
}
