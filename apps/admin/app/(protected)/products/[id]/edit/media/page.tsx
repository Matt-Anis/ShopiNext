import { notFound } from "next/navigation"

import { getProductMediaData } from "@/features/products/queries"
import { ProductWizardSteps } from "../../../_components/product-wizard-steps"
import { MediaForm } from "./_components/media-form"

export default async function ProductMediaPage({
  params,
}: PageProps<"/products/[id]/edit/media">) {
  const { id } = await params
  const product = await getProductMediaData(id)

  if (!product) {
    notFound()
  }

  return (
    <div className="flex gap-10 px-8 pt-9 pb-16">
      <ProductWizardSteps step={4} productId={id} productName={product.name} />
      <div className="w-full max-w-5xl">
        <h1 className="text-2xl font-semibold tracking-tight">
          {product.name}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Upload and organize images for this product. The first image serves as
          the cover photo across the storefront.
        </p>
        <MediaForm
          productId={id}
          productName={product.name}
          initialImages={product.images}
          initialStatus={product.status}
        />
      </div>
    </div>
  )
}
