import { getProductsList } from "@/features/products/queries"
import { ProductsClient } from "./_components/products-client"

export default async function ProductsPage() {
  const products = await getProductsList()

  return (
    <div className="flex flex-col gap-4 px-4 py-6">
      <ProductsClient products={products} />
    </div>
  )
}
