"use client"

import Link from "next/link"
import { Check } from "lucide-react"

import { cn } from "@repo/ui/utils"
import { Tooltip, TooltipContent, TooltipTrigger } from "@repo/ui/tooltip"
import { useBreadcrumb } from "../../_components/breadcrumb-provider"

const STEPS = [
  { label: "Details", description: "Name, slug, and description" },
  {
    label: "Categories & options",
    description: "Categories and options for this product",
  },
  { label: "Variants", description: "Create variants from your options" },
]

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
    ...STEPS.slice(0, step).map(({ label }, index) => ({
      label,
      href:
        index === step - 1
          ? undefined
          : `/products/${productId}/edit/step-${index + 1}`,
    })),
  ])

  return (
    <div className="flex max-w-40 flex-col">
      {STEPS.map((s, index) => {
        const stepNumber = index + 1
        const isComplete = stepNumber < step
        const isCurrent = stepNumber === step
        const isLast = stepNumber === STEPS.length
        const href = isComplete
          ? `/products/${productId}/edit/step-${stepNumber}`
          : undefined

        const circle = (
          <span
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-medium",
              isComplete && "bg-primary text-primary-foreground",
              isCurrent && "border-2 border-primary text-primary",
              !isComplete &&
                !isCurrent &&
                "border border-dashed border-border text-muted-foreground"
            )}
          >
            {isComplete ? <Check className="size-4" /> : stepNumber}
          </span>
        )

        return (
          <div key={s.label} className="flex gap-3">
            <div className="flex flex-col items-center">
              <Tooltip>
                <TooltipTrigger
                  render={
                    href ? (
                      <Link href={href}>{circle}</Link>
                    ) : (
                      <span role="button" aria-disabled="true" tabIndex={0}>
                        {circle}
                      </span>
                    )
                  }
                />
                <TooltipContent side="right">{s.description}</TooltipContent>
              </Tooltip>
              {!isLast && (
                <div
                  className={cn(
                    "my-1 h-8 w-px",
                    isComplete ? "bg-primary" : "bg-border"
                  )}
                />
              )}
            </div>
            <span
              className={cn(
                "pt-1.5 text-xs",
                isCurrent
                  ? "font-medium text-foreground"
                  : "text-muted-foreground",
                !isLast && "pb-6"
              )}
            >
              {s.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
