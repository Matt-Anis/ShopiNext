import { notFound } from "next/navigation"

import { requirePermission } from "@/lib/auth/guards"
import { getProductForWizard } from "@/features/products/queries"
import { ProductWizardSteps } from "../../../_components/product-wizard-steps"
import { EditProductForm } from "./_components/edit-product-form"

export default async function ProductDetailsPage({
  params,
}: PageProps<"/products/[id]/edit/details">) {
  await requirePermission("products", "update")
  const { id } = await params
  const product = await getProductForWizard(id)

  if (!product) {
    notFound()
  }

  return (
    <div className="admin-product-editor">
      <ProductWizardSteps step={1} productId={id} productName={product.name} />
      <div className="w-full min-w-0 max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight wrap-anywhere sm:text-3xl">
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
