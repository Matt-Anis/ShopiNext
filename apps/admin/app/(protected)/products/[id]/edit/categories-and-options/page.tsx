import { notFound } from "next/navigation"

import { requirePermission } from "@/lib/auth/guards"
import { getProductStep2Data, getCategoriesList } from "@/features/products/queries"
import { ProductWizardSteps } from "../../../_components/product-wizard-steps"
import { Step2Form } from "./_components/step-2-form"

export default async function ProductCategoriesAndOptionsPage({
  params,
}: PageProps<"/products/[id]/edit/categories-and-options">) {
  await requirePermission("products", "update")
  const { id } = await params
  const [product, categories] = await Promise.all([
    getProductStep2Data(id),
    getCategoriesList(),
  ])

  if (!product) {
    notFound()
  }

  return (
    <div className="admin-product-editor">
      <ProductWizardSteps step={2} productId={id} productName={product.name} />
      <div className="w-full min-w-0 max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight wrap-anywhere sm:text-3xl">
          {product.name}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Assign categories and define the options this product comes in.
        </p>
        <Step2Form
          productId={id}
          categories={categories}
          selectedCategoryIds={product.productCategories.map(
            (pc) => pc.categoryId
          )}
          options={product.options}
        />
      </div>
    </div>
  )
}
