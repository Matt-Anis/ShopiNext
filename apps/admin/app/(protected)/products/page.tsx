import { requirePermission } from "@/lib/auth/guards"
import { getLowStockVariants, getProductsList } from "@/features/products/queries"
import { LowStockVariants } from "./_components/low-stock-variants"
import { ProductsClient } from "./_components/products-client"

export default async function ProductsPage({ searchParams }: PageProps<"/products">) {
  await requirePermission("products", "read")

  if ((await searchParams).view === "low-stock") {
    return <LowStockVariants variants={await getLowStockVariants()} />
  }

  const products = await getProductsList()

  return (
    <div className="flex flex-col gap-5 px-4 py-6 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Products</h1>
      <ProductsClient products={products} />
    </div>
  )
}
