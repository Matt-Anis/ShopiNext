"use client"

import { createContext, useContext, useMemo, useState } from "react"
import type { ReactNode } from "react"

import { cn } from "@repo/ui/utils"
import { Button } from "@repo/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@repo/ui/tooltip"
import { formatPrice } from "@/lib/utils"
import { CartControl } from "@/features/cart/CartControl"
import type { CartItemVariant } from "@/features/cart/actions"
import type { ProductDetail } from "@/features/products/queries"
import { BuyNowButton } from "./BuyNowButton"

type Option = ProductDetail["options"][number]
type Variant = ProductDetail["variants"][number]
type PillStatus = "available" | "out-of-stock" | "unavailable"

type VariantPickerContextValue = {
  options: Option[]
  selection: Record<string, string>
  select: (optionId: string, valueId: string) => void
  statusFor: (optionId: string, valueId: string) => PillStatus
  matchedVariant: Variant | null
  selectedLabel: string
  minPrice: number | null
}

const VariantPickerContext = createContext<VariantPickerContextValue | null>(
  null
)

const useVariantPicker = () => {
  const context = useContext(VariantPickerContext)
  if (!context) {
    throw new Error(
      "VariantPicker components must be rendered within a VariantPickerProvider"
    )
  }
  return context
}

// A variant "contains" a set of value ids if every one of those ids is
// among its own option values. Used both to check whether a candidate pill
// is still reachable given the rest of the current selection, and — once
// every option has a selection — to find the matching variant itself.
const variantContains = (variant: Variant, valueIds: string[]) =>
  valueIds.every((id) => variant.optionValueIds.includes(id))

export function VariantPickerProvider({
  options,
  variants,
  minPrice,
  children,
}: {
  options: Option[]
  variants: Variant[]
  minPrice: number | null
  children: ReactNode
}) {
  const [selection, setSelection] = useState<Record<string, string>>({})

  const select = (optionId: string, valueId: string) => {
    setSelection((prev) => ({ ...prev, [optionId]: valueId }))
  }

  const statusFor = (optionId: string, valueId: string): PillStatus => {
    const candidateIds = [
      ...Object.entries(selection)
        .filter(([id]) => id !== optionId)
        .map(([, value]) => value),
      valueId,
    ]

    const matches = variants.filter((variant) =>
      variantContains(variant, candidateIds)
    )

    if (matches.length === 0) return "unavailable"
    return matches.some((variant) => variant.maxPerOrder > 0)
      ? "available"
      : "out-of-stock"
  }

  const matchedVariant = useMemo(() => {
    if (Object.keys(selection).length !== options.length) return null

    const selectedIds = Object.values(selection)
    return (
      variants.find((variant) => variantContains(variant, selectedIds)) ??
      null
    )
  }, [selection, variants, options.length])

  const selectedLabel = useMemo(() => {
    return options
      .map((option) => {
        const valueId = selection[option.id]
        return option.values.find((value) => value.id === valueId)?.value
      })
      .filter((value): value is string => Boolean(value))
      .join(" / ")
  }, [options, selection])

  return (
    <VariantPickerContext.Provider
      value={{
        options,
        selection,
        select,
        statusFor,
        matchedVariant,
        selectedLabel,
        minPrice,
      }}
    >
      {children}
    </VariantPickerContext.Provider>
  )
}

export function VariantOptionPills() {
  const { options, selection, select, statusFor } = useVariantPicker()

  return (
    <div className="flex flex-col gap-4 pb-4">
      {options.map((option) => (
        <div key={option.id} className="flex flex-col gap-2">
          <span className="text-sm font-medium text-muted-foreground">
            {option.name}
          </span>
          <div className="flex flex-wrap gap-2">
            {option.values.map((value) => {
              const status = statusFor(option.id, value.id)
              const isSelected = selection[option.id] === value.id
              const isDisabled = status !== "available" && !isSelected

              const pillClassName = cn(
                "rounded-full border px-3 py-1 text-xs transition-colors",
                isSelected
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-background text-foreground hover:border-foreground",
                isDisabled &&
                  "cursor-not-allowed text-muted-foreground line-through hover:border-border"
              )

              if (!isDisabled) {
                return (
                  <button
                    key={value.id}
                    type="button"
                    onClick={() => select(option.id, value.id)}
                    aria-pressed={isSelected}
                    data-testid={`variant-pill-${option.name}-${value.value}`}
                    className={pillClassName}
                  >
                    {value.value}
                  </button>
                )
              }

              return (
                <Tooltip key={value.id}>
                  <TooltipTrigger
                    render={
                      <span
                        role="button"
                        aria-disabled="true"
                        tabIndex={0}
                        data-testid={`variant-pill-${option.name}-${value.value}`}
                        className={pillClassName}
                      >
                        {value.value}
                      </span>
                    }
                  />
                  <TooltipContent>
                    {status === "out-of-stock" ? "Sold out" : "Not available"}
                  </TooltipContent>
                </Tooltip>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

export function VariantPrice({ className }: { className?: string }) {
  const { matchedVariant, minPrice } = useVariantPicker()

  if (matchedVariant) {
    return (
      <p data-testid="variant-price" className={className}>
        {formatPrice(matchedVariant.price)}
      </p>
    )
  }

  if (minPrice == null) {
    return (
      <p data-testid="variant-price" className={className}>
        Sold out
      </p>
    )
  }

  return (
    <p data-testid="variant-price" className={className}>
      From {formatPrice(minPrice)}
    </p>
  )
}

export function VariantAddToCart({
  product,
  size = "default",
  className,
}: {
  product: CartItemVariant["product"]
  size?: "default" | "lg"
  className?: string
}) {
  const { matchedVariant, selectedLabel, options } = useVariantPicker()
  const buttonSize = size === "lg" ? "lg" : "default"

  if (!matchedVariant) {
    return (
      <Button type="button" size={buttonSize} className={cn("w-full", className)} disabled>
        {options.length > 0 ? "Select options" : "Sold out"}
      </Button>
    )
  }

  return (
    <CartControl
      variant={{
        id: matchedVariant.id,
        price: matchedVariant.price,
        maxPerOrder: matchedVariant.maxPerOrder,
        optionLabel: selectedLabel,
        product,
      }}
      size={size}
      className={className}
    />
  )
}

export function VariantBuyNow({ className }: { className?: string }) {
  const { matchedVariant, options } = useVariantPicker()

  if (!matchedVariant || matchedVariant.maxPerOrder <= 0) {
    return (
      <Button type="button" size="lg" className={cn("w-full", className)} disabled>
        {!matchedVariant && options.length > 0 ? "Select options" : "Sold out"}
      </Button>
    )
  }

  return (
    <BuyNowButton
      variantId={matchedVariant.id}
      maxPerOrder={matchedVariant.maxPerOrder}
      className={className}
    />
  )
}
