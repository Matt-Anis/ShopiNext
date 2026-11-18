"use client"

import { useState } from "react"
import { Plus } from "lucide-react"

import { toast } from "@repo/ui/toast"
import { Button } from "@repo/ui/button"
import { Input } from "@repo/ui/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@repo/ui/input-group"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@repo/ui/combobox"
import { TableCell, TableRow } from "@repo/ui/table"

import { slugifyLabel, type Option } from "./variant-utils"

export interface NewVariantDraft {
  sku: string
  optionValueIds: string[]
  price: string
  stock: string
  maxPerOrder: string
}

interface NewVariantRowProps {
  productSlug: string
  options: Option[]
  initialSku: string
  isCreating: boolean
  onCreate: (draft: NewVariantDraft) => void
}

export function NewVariantRow({
  productSlug,
  options,
  initialSku,
  isCreating,
  onCreate,
}: NewVariantRowProps) {
  const [draftSelections, setDraftSelections] = useState<
    Record<string, string | null>
  >({})
  const [draftSku, setDraftSku] = useState(initialSku)
  const [skuTouched, setSkuTouched] = useState(false)
  const [draftPrice, setDraftPrice] = useState("0.00")
  const [draftStock, setDraftStock] = useState("0")
  const [draftMaxPerOrder, setDraftMaxPerOrder] = useState("1")

  function updateOptionSelection(optionId: string, valueName: string | null) {
    setDraftSelections((prev) => {
      const next = { ...prev, [optionId]: valueName }

      if (!skuTouched) {
        const label = options
          .map((option) => next[option.id])
          .filter((name): name is string => Boolean(name))
          .join("-")
        setDraftSku(
          label ? `${productSlug}-${slugifyLabel(label)}` : productSlug
        )
      }

      return next
    })
  }

  function resolveDraftOptionValueIds() {
    const ids: string[] = []
    for (const option of options) {
      const selectedName = draftSelections[option.id]
      if (!selectedName) continue
      const value = option.values.find((v) => v.value === selectedName)
      if (value) ids.push(value.id)
    }
    return ids
  }

  function handleAddClick() {
    const trimmedSku = draftSku.trim()
    if (!trimmedSku) {
      toast.add({ title: "SKU is required", type: "error" })
      return
    }

    const optionValueIds = resolveDraftOptionValueIds()

    if (optionValueIds.length === 0 && options.length > 0) {
      toast.add({
        title: "Select at least one option value",
        type: "error",
      })
      return
    }

    onCreate({
      sku: trimmedSku,
      optionValueIds,
      price: draftPrice,
      stock: draftStock,
      maxPerOrder: draftMaxPerOrder,
    })
  }

  return (
    <TableRow role="row">
      <TableCell role="cell" className="align-top max-lg:empty:hidden">
        {options.length > 0 && (
          <div className="flex flex-col gap-1.5">
            {options.map((option) =>
              option.values.length === 0 ? (
                <p key={option.id} className="text-xs text-muted-foreground">
                  {option.name}: no values yet
                </p>
              ) : (
                <Combobox
                  key={option.id}
                  items={option.values.map((v) => v.value)}
                  value={draftSelections[option.id] ?? null}
                  onValueChange={(name) =>
                    updateOptionSelection(option.id, name)
                  }
                >
                  <ComboboxInput
                    showClear
                    placeholder={option.name}
                    className="h-8 w-32 max-lg:h-11 max-lg:w-full"
                  />
                  <ComboboxContent>
                    <ComboboxEmpty>No values found.</ComboboxEmpty>
                    <ComboboxList>
                      {(item: string) => (
                        <ComboboxItem key={item} value={item}>
                          {item}
                        </ComboboxItem>
                      )}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
              )
            )}
          </div>
        )}
      </TableCell>
      <TableCell role="cell" className="align-top">
        <span aria-hidden="true" className="mb-1 block text-xs font-medium text-muted-foreground lg:hidden">SKU</span>
        <Input
          aria-label="SKU"
          value={draftSku}
          onChange={(event) => {
            setSkuTouched(true)
            setDraftSku(event.target.value)
          }}
          className="h-8 w-40 border-border bg-transparent font-mono text-xs max-lg:h-11 max-lg:w-full"
        />
        {!skuTouched && draftSku && (
          <p className="mt-1 text-[11px] text-muted-foreground italic">
            Suggested from the combination
          </p>
        )}
      </TableCell>
      <TableCell role="cell" className="align-top">
        <span aria-hidden="true" className="mb-1 block text-xs font-medium text-muted-foreground lg:hidden">Price</span>
        <InputGroup className="h-8 w-28 max-lg:h-11 max-lg:w-full">
          <InputGroupAddon>
            <InputGroupText>$</InputGroupText>
          </InputGroupAddon>
          <InputGroupInput
            type="number"
            min={0}
            step="0.01"
            aria-label="Price"
            value={draftPrice}
            onChange={(event) => setDraftPrice(event.target.value)}
          />
        </InputGroup>
      </TableCell>
      <TableCell role="cell" className="align-top">
        <span aria-hidden="true" className="mb-1 block text-xs font-medium text-muted-foreground lg:hidden">Stock</span>
        <Input
          aria-label="Stock"
          type="number"
          min={0}
          value={draftStock}
          onChange={(event) => setDraftStock(event.target.value)}
          className="h-8 w-20 border-border bg-transparent max-lg:h-11 max-lg:w-full"
        />
      </TableCell>
      <TableCell role="cell" className="align-top">
        <span aria-hidden="true" className="mb-1 block text-xs font-medium text-muted-foreground lg:hidden">Max per order</span>
        <Input
          aria-label="Max per order"
          type="number"
          min={1}
          value={draftMaxPerOrder}
          onChange={(event) => setDraftMaxPerOrder(event.target.value)}
          className="h-8 w-20 border-border bg-transparent max-lg:h-11 max-lg:w-full"
        />
      </TableCell>
      <TableCell role="cell" className="align-top">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="max-lg:h-11"
          disabled={isCreating}
          onClick={handleAddClick}
        >
          <Plus className="size-4" />
          Add variant
        </Button>
      </TableCell>
    </TableRow>
  )
}
