import { getAllProducts } from "@/features/products/queries"
import HeroSection from "./_components/HeroSection"
import ProductCatalog from "./_components/ProductCatalog"
import { parseProductDiscovery } from "@/features/products/discovery"
import { ProductEmptyState } from "@/features/products/components/product-empty-state"

export default async function Home({ searchParams }: PageProps<"/">) {
  const discovery = parseProductDiscovery(await searchParams)
  const { products, nextCursor } = await getAllProducts(discovery)

  return (
    <>
      <HeroSection
        product={products.find((product) => product.images.length > 0)}
      />
      <div className="storefront-container py-12 md:py-20">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6 md:mb-10">
          <h2 className="section-heading">
            Our products<span className="text-muted-foreground">.</span>
          </h2>
          <p className="font-mono text-xs tracking-wider text-muted-foreground uppercase">
            Find something you love
          </p>
        </div>
        <ProductCatalog
          initialProducts={products}
          initialCursor={nextCursor}
          discovery={discovery}
          emptyState={<ProductEmptyState discovery={discovery} pathname="/" />}
        />
      </div>
    </>
  )
}
