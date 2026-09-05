import { CreateProductForm } from "./_components/create-product-form"
import { ProductWizardSteps } from "../_components/product-wizard-steps"

export default function NewProductPage() {
  return (
    <div className="flex gap-10 px-8 pt-9">
      <ProductWizardSteps step={1} />
      <div className="max-w-[480px]">
        <p className="text-sm text-muted-foreground">
          Categories, options, and variants come next.
        </p>
        <CreateProductForm />
      </div>
    </div>
  )
}
