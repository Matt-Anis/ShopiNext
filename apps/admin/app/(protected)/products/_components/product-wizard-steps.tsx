"use client"

import Link from "next/link"
import { Check } from "lucide-react"

import { cn } from "@repo/ui/utils"
import { Tooltip, TooltipContent, TooltipTrigger } from "@repo/ui/tooltip"
import { useBreadcrumb } from "../../_components/breadcrumb-provider"

const STEPS = [
  {
    label: "Details",
    shortLabel: "Details",
    description: "Name, slug, and description",
    slug: "details",
  },
  {
    label: "Categories & options",
    shortLabel: "Options",
    description: "Categories and options for this product",
    slug: "categories-and-options",
  },
  {
    label: "Variants",
    shortLabel: "Variants",
    description: "Create variants from your options",
    slug: "variants",
  },
  {
    label: "Media",
    shortLabel: "Media",
    description: "Upload and organize product images",
    slug: "media",
  },
] as const

interface ProductWizardStepsProps {
  step: 1 | 2 | 3 | 4
  productId?: string
  productName?: string
}

export function ProductWizardSteps({
  step,
  productId,
  productName,
}: ProductWizardStepsProps) {
  const stepsToDisplay = productId ? STEPS : STEPS.slice(0, step)

  useBreadcrumb([
    { label: "Products", href: "/products" },
    ...(productId && productName
      ? [{ label: productName, href: `/products/${productId}` }]
      : []),
    ...stepsToDisplay.map(({ label, slug }, index) => {
      const isCurrent = index === step - 1
      return {
        label,
        href:
          isCurrent || !productId
            ? undefined
            : `/products/${productId}/edit/${slug}`,
      }
    }),
  ])

  return (
    <nav
      aria-label="Product editor steps"
      className="w-full shrink-0 lg:sticky lg:top-(--admin-header-offset) lg:w-fit lg:self-start"
    >
      <ol className="grid grid-cols-4 gap-1 rounded-xl border border-border bg-card p-1.5 lg:flex lg:flex-col lg:gap-0 lg:border-0 lg:bg-transparent lg:p-0">
        {STEPS.map((s, index) => {
          const stepNumber = index + 1
          const isComplete = stepNumber < step
          const isCurrent = stepNumber === step
          const isLast = stepNumber === STEPS.length
          const href =
            productId && !isCurrent
              ? `/products/${productId}/edit/${s.slug}`
              : undefined

          const stepContent = (
            <>
              <span
                aria-hidden="true"
                className={cn(
                  "grid size-8 shrink-0 place-items-center rounded-full border text-sm font-medium",
                  isCurrent && "border-brand bg-brand text-sidebar-primary-foreground",
                  isComplete && "border-muted bg-muted text-foreground",
                  !isComplete && !isCurrent && "border-border text-muted-foreground"
                )}
              >
                {isComplete ? <Check className="size-4" /> : stepNumber}
              </span>
              <span className="text-center text-xs font-medium lg:sr-only">{s.shortLabel}</span>
            </>
          )

          const stepClassName = "flex min-h-14 w-full flex-col items-center justify-center gap-1 rounded-lg py-1 lg:min-h-0 lg:size-9 lg:p-0"

          return (
            <li key={s.label} className="flex min-w-0 flex-col items-center">
              <Tooltip>
                <TooltipTrigger
                  render={
                    href ? (
                      <Link
                        href={href}
                        aria-label={s.label}
                        className={cn(stepClassName, "hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring")}
                      >
                        {stepContent}
                      </Link>
                    ) : (
                      <span
                        aria-current={isCurrent ? "step" : undefined}
                        aria-disabled={isCurrent ? undefined : true}
                        className={cn(stepClassName, !isCurrent && "text-muted-foreground")}
                      >
                        {stepContent}
                      </span>
                    )
                  }
                />
                <TooltipContent side="right">{s.description}</TooltipContent>
              </Tooltip>
              {!isLast && (
                <div
                  className={cn(
                    "my-1 hidden h-8 w-px lg:block",
                    isComplete ? "bg-primary" : "bg-border"
                  )}
                />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
