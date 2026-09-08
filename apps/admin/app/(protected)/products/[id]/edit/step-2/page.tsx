import { notFound } from "next/navigation"

import { getProductStep2Data, getCategoriesList } from "@/features/products/queries"
import { ProductWizardSteps } from "../../../_components/product-wizard-steps"
import { Step2Form } from "./_components/step-2-form"

export default async function ProductStep2Page({
  params,
}: PageProps<"/products/[id]/edit/step-2">) {
  const { id } = await params
  const [product, categories] = await Promise.all([
    getProductStep2Data(id),
    getCategoriesList(),
  ])

  if (!product) {
    notFound()
  }

  return (
    <div className="flex gap-10 px-8 pt-9 pb-16">
      <ProductWizardSteps step={2} productId={id} productName={product.name} />
      <div className="w-full max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight">
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
