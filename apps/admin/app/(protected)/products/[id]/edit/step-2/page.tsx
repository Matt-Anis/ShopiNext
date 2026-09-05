import { notFound } from "next/navigation"

import { getProductForWizard } from "@/features/products/queries"
import { ProductWizardSteps } from "../../../_components/product-wizard-steps"

export default async function ProductStep2Page({
  params,
}: PageProps<"/products/[id]/edit/step-2">) {
  const { id } = await params
  const product = await getProductForWizard(id)

  if (!product) {
    notFound()
  }

  return (
    <div className="px-8 pt-9">
      <div className="max-w-[480px]">
        <ProductWizardSteps step={2} productId={id} />
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">
          {product.name}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Categories and options — coming soon.
        </p>
      </div>
    </div>
  )
}
