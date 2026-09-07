import { notFound } from "next/navigation"

import { getProductForWizard } from "@/features/products/queries"
import { ProductWizardSteps } from "../../../_components/product-wizard-steps"
import { EditProductForm } from "./_components/edit-product-form"

export default async function ProductStep1Page({
  params,
}: PageProps<"/products/[id]/edit/step-1">) {
  const { id } = await params
  const product = await getProductForWizard(id)

  if (!product) {
    notFound()
  }

  return (
    <div className="flex gap-10 px-8 pt-9 pb-16">
      <ProductWizardSteps step={1} productId={id} />
      <div className="w-full max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight">
          {product.name}
        </h1>
        <EditProductForm
          productId={id}
          name={product.name}
          slug={product.slug}
          description={product.description}
        />
      </div>
    </div>
  )
}
