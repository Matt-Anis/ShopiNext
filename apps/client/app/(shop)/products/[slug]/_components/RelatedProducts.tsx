import { ProductCard } from "@/components/ProductCard";
import { getRelatedProducts } from "@/features/products/related-products";

export default async function RelatedProducts({
  productId,
  categoryIds,
}: {
  productId: string;
  categoryIds: string[];
}) {
  const products = await getRelatedProducts({ productId, categoryIds });

  if (products.length === 0) return null;

  return (
    <section
      aria-labelledby="related-products-heading"
      className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8 lg:py-12"
    >
      <h2
        id="related-products-heading"
        className="mb-6 font-heading text-2xl font-semibold"
      >
        Related products
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
