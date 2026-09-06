import { notFound } from "next/navigation"

import { getProductStep3Data } from "@/features/products/queries"
import { ProductWizardSteps } from "../../../_components/product-wizard-steps"
import { Step3Form } from "./_components/step-3-form"

export default async function ProductStep3Page({
  params,
}: PageProps<"/products/[id]/edit/step-3">) {
  const { id } = await params
  const product = await getProductStep3Data(id)

  if (!product) {
    notFound()
  }

  return (
    <div className="flex gap-10 px-8 pt-9 pb-16">
      <ProductWizardSteps step={3} productId={id} />
      <div className="w-full max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight">
          {product.name}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Create the variants customers will actually buy, from the option
          combinations you set up.
        </p>
        <Step3Form
          productId={id}
          productSlug={product.slug}
          options={product.options}
          variants={product.variants.map((variant) => ({
            id: variant.id,
            sku: variant.sku,
            price: variant.price,
            stock: variant.stock,
            maxPerOrder: variant.maxPerOrder,
            optionValueIds: variant.variantOptionValues.map(
              (v) => v.optionValueId
            ),
          }))}
        />
      </div>
    </div>
  )
}
