import { requirePermission } from "@/lib/auth/guards"
import { getProductsList } from "@/features/products/queries"
import { ProductsClient } from "./_components/products-client"

export default async function ProductsPage() {
  await requirePermission("products", "read")
  const products = await getProductsList()

  return (
    <div className="flex flex-col gap-5 px-4 py-6 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Products</h1>
      <ProductsClient products={products} />
    </div>
  )
}
