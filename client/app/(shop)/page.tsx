import { getAllProducts } from "@/db/queries";
import HeroSection from "./_components/HeroSection";
import ProductList from "./_components/ProductList";

export default async function Home() {
  const { products, nextCursor } = await getAllProducts();

  return (
    <>
      <HeroSection />
      <ProductList initialProducts={products} initialCursor={nextCursor} />
    </>
  );
}
