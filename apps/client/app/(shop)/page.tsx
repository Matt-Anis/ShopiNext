import { getAllProducts } from "@/features/products/queries";
import HeroSection from "./_components/HeroSection";
import ProductCatalog from "./_components/ProductCatalog";
import { parseProductDiscovery } from "@/features/products/discovery";
import { ProductEmptyState } from "@/features/products/components/product-empty-state";

export default async function Home({ searchParams }: PageProps<"/">) {
  const discovery = parseProductDiscovery(await searchParams);
  const { products, nextCursor } = await getAllProducts(discovery);

  return (
    <>
      <HeroSection />
      <div className="mx-auto w-full max-w-7xl px-6 py-16 md:px-10">
        <h2 className="mb-8 text-center text-4xl font-semibold">Our products</h2>
        <ProductCatalog
          initialProducts={products}
          initialCursor={nextCursor}
          discovery={discovery}
          emptyState={<ProductEmptyState discovery={discovery} pathname="/" />}
        />
      </div>
    </>
  );
}
