import { CreateProductForm } from "./_components/create-product-form"

export default function NewProductPage() {
  return (
    <div className="px-8 pt-9">
      <div className="max-w-[480px]">
        <h1 className="text-2xl font-semibold tracking-tight">New product</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Step 1 of 3 — details. Categories, options, and variants come next.
        </p>
        <CreateProductForm />
      </div>
    </div>
  )
}
