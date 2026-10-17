"use client"

import { useRouter } from "next/navigation"

import { Button } from "@repo/ui/button"
import { CategoriesSection } from "./categories-section"
import { OptionsSection } from "./options-section"

interface Category {
  id: string
  name: string
}

interface OptionValue {
  id: string
  value: string
}

interface Option {
  id: string
  name: string
  values: OptionValue[]
}

interface Step2FormProps {
  productId: string
  categories: Category[]
  selectedCategoryIds: string[]
  options: Option[]
}

export function Step2Form({
  productId,
  categories,
  selectedCategoryIds,
  options,
}: Step2FormProps) {
  const router = useRouter()

  return (
    <div className="mt-8 flex flex-col gap-8">
      <CategoriesSection
        productId={productId}
        categories={categories}
        selectedCategoryIds={selectedCategoryIds}
      />

      <OptionsSection productId={productId} options={options} />

      <div className="flex items-center gap-3">
        <Button
          type="button"
          onClick={() => router.push(`/products/${productId}/edit/step-3`)}
        >
          Continue
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/products")}
        >
          Save & exit
        </Button>
      </div>
    </div>
  )
}
