import { requirePermission } from "@/lib/auth/guards"
import { CreateProductForm } from "./_components/create-product-form"
import { ProductWizardSteps } from "../_components/product-wizard-steps"

export default async function NewProductPage() {
  await requirePermission("products", "create")

  return (
    <div className="admin-product-editor">
      <ProductWizardSteps step={1} />
      <div className="w-full min-w-0 max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">New product</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Categories, options, and variants come next.
        </p>
        <CreateProductForm />
      </div>
    </div>
  )
}
