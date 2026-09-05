"use client"

import { useBreadcrumb } from "../../_components/breadcrumb-provider"

const STEP_LABELS = ["Details", "Categories & options", "Variants"]

interface ProductWizardStepsProps {
  step: 1 | 2 | 3
  productId: string
}

export function ProductWizardSteps({
  step,
  productId,
}: ProductWizardStepsProps) {
  useBreadcrumb([
    { label: "Products", href: "/products" },
    ...STEP_LABELS.slice(0, step).map((label, index) => ({
      label,
      href:
        index === step - 1
          ? undefined
          : `/products/${productId}/edit/step-${index + 1}`,
    })),
  ])

  return (
    <p className="text-sm font-medium text-muted-foreground">
      Step {step} of {STEP_LABELS.length} — {STEP_LABELS[step - 1]}
    </p>
  )
}
