"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Plus, Save, Trash2 } from "lucide-react"

import {
  createProductVariant,
  updateProductVariant,
  deleteProductVariant,
  setProductStatus,
} from "@/features/products/actions"
import { toast } from "@repo/ui/toast"
import { Button } from "@repo/ui/button"
import { Badge } from "@repo/ui/badge"
import { Input } from "@repo/ui/input"
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@repo/ui/input-group"
import { Tooltip, TooltipContent, TooltipTrigger } from "@repo/ui/tooltip"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@repo/ui/combobox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/table"

interface OptionValue {
  id: string
  value: string
}

interface Option {
  id: string
  name: string
  values: OptionValue[]
}

interface Variant {
  id: string
  sku: string
  price: number
  stock: number
  maxPerOrder: number
  optionValueIds: string[]
}

interface Step3FormProps {
  productId: string
  productSlug: string
  options: Option[]
  variants: Variant[]
}

interface Row {
  id: string
  optionValueIds: string[]
  sku: string
  price: string
  stock: string
  maxPerOrder: string
  saved: { sku: string; price: string; stock: string; maxPerOrder: string }
}

function centsToDisplay(cents: number) {
  return (cents / 100).toFixed(2)
}

function displayToCents(display: string) {
  const value = Number(display)
  return Number.isFinite(value) ? Math.round(value * 100) : 0
}

function toRow(variant: Variant): Row {
  const saved = {
    sku: variant.sku,
    price: centsToDisplay(variant.price),
    stock: String(variant.stock),
    maxPerOrder: String(variant.maxPerOrder),
  }
  return {
    id: variant.id,
    optionValueIds: variant.optionValueIds,
    ...saved,
    saved,
  }
}

function isRowDirty(row: Row) {
  return (
    row.sku !== row.saved.sku ||
    row.price !== row.saved.price ||
    row.stock !== row.saved.stock ||
    row.maxPerOrder !== row.saved.maxPerOrder
  )
}

function slugifyLabel(label: string) {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function Step3Form({
  productId,
  productSlug,
  options,
  variants: initialVariants,
}: Step3FormProps) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [rows, setRows] = useState<Row[]>(() => initialVariants.map(toRow))
  const [savingId, setSavingId] = useState<string | null>(null)
  const [isFinishing, setIsFinishing] = useState(false)

  const [draftSelections, setDraftSelections] = useState<
    Record<string, string | null>
  >({})
  const [draftSku, setDraftSku] = useState("")
  const [skuTouched, setSkuTouched] = useState(false)
  const [draftPrice, setDraftPrice] = useState("0.00")
  const [draftStock, setDraftStock] = useState("0")
  const [draftMaxPerOrder, setDraftMaxPerOrder] = useState("1")
  const [isCreating, setIsCreating] = useState(false)

  const valueLookup = useMemo(() => {
    const map = new Map<string, { value: string; optionName: string }>()
    for (const option of options) {
      for (const value of option.values) {
        map.set(value.id, { value: value.value, optionName: option.name })
      }
    }
    return map
  }, [options])

  function labelsForValueIds(optionValueIds: string[]) {
    return optionValueIds.map((id) => valueLookup.get(id)?.value ?? "?")
  }

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

  function updateRow(id: string, patch: Partial<Row>) {
    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, ...patch } : row))
    )
  }

  function handleCreate() {
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

    setIsCreating(true)
    startTransition(async () => {
      const promise = createProductVariant(
        productId,
        {
          sku: trimmedSku,
          price: displayToCents(draftPrice),
          stock: Number(draftStock),
          maxPerOrder: Number(draftMaxPerOrder),
        },
        optionValueIds
      )

      await toast
        .promise(promise, {
          loading: { title: "Creating variant..." },
          success: (variant) => {
            setRows((prev) => [
              ...prev,
              toRow({ ...variant, optionValueIds }),
            ])
            setDraftSelections({})
            setDraftSku(productSlug)
            setSkuTouched(false)
            setDraftPrice("0.00")
            setDraftStock("0")
            setDraftMaxPerOrder("1")
            return { title: "Variant created" }
          },
          error: (error: Error) => ({
            title: "Failed to create variant",
            description: error.message,
          }),
        })
        .catch(() => {})
      setIsCreating(false)
    })
  }

  function handleUpdate(row: Row) {
    setSavingId(row.id)
    startTransition(async () => {
      const promise = updateProductVariant(productId, row.id, {
        sku: row.sku,
        price: displayToCents(row.price),
        stock: Number(row.stock),
        maxPerOrder: Number(row.maxPerOrder),
      })

      await toast
        .promise(promise, {
          loading: { title: "Saving variant..." },
          success: () => {
            updateRow(row.id, {
              saved: {
                sku: row.sku,
                price: row.price,
                stock: row.stock,
                maxPerOrder: row.maxPerOrder,
              },
            })
            return { title: "Variant updated" }
          },
          error: (error: Error) => ({
            title: "Failed to update variant",
            description: error.message,
          }),
        })
        .catch(() => {})
      setSavingId(null)
    })
  }

  function handleDelete(row: Row) {
    setSavingId(row.id)
    startTransition(async () => {
      const promise = deleteProductVariant(productId, row.id)

      await toast
        .promise(promise, {
          loading: { title: "Deleting variant..." },
          success: () => {
            setRows((prev) => prev.filter((r) => r.id !== row.id))
            return { title: "Variant deleted" }
          },
          error: (error: Error) => ({
            title: "Failed to delete variant",
            description: error.message,
          }),
        })
        .catch(() => {})
      setSavingId(null)
    })
  }

  function handleFinish(status: "draft" | "active") {
    setIsFinishing(true)
    startTransition(async () => {
      const promise = setProductStatus(productId, status)

      await toast
        .promise(promise, {
          loading: {
            title: status === "active" ? "Publishing..." : "Saving draft...",
          },
          success: () => {
            router.push("/products")
            return {
              title: status === "active" ? "Product published" : "Draft saved",
            }
          },
          error: (error: Error) => ({
            title:
              status === "active"
                ? "Failed to publish"
                : "Failed to save draft",
            description: error.message,
          }),
        })
        .catch(() => {})
      setIsFinishing(false)
    })
  }

  return (
    <div className="mt-8 flex flex-col gap-6">
      <div className="rounded-2xl border border-border">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold">Variants</span>
            <span className="text-xs text-muted-foreground">
              {rows.length} combination{rows.length === 1 ? "" : "s"}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            Prices in USD
          </span>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Combination</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Max/order</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const isSaving = savingId === row.id
              return (
                <TableRow key={row.id}>
                  <TableCell>
                    {row.optionValueIds.length === 0 ? (
                      <span className="text-sm text-muted-foreground">
                        No options
                      </span>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {labelsForValueIds(row.optionValueIds).map(
                          (label, index) => (
                            <Badge key={index} variant="secondary">
                              {label}
                            </Badge>
                          )
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Input
                      value={row.sku}
                      onChange={(event) =>
                        updateRow(row.id, { sku: event.target.value })
                      }
                      className="h-8 w-40 border-border bg-transparent font-mono text-xs"
                    />
                  </TableCell>
                  <TableCell>
                    <InputGroup className="h-8 w-28">
                      <InputGroupAddon>
                        <InputGroupText>$</InputGroupText>
                      </InputGroupAddon>
                      <InputGroupInput
                        type="number"
                        min={0}
                        step="0.01"
                        value={row.price}
                        onChange={(event) =>
                          updateRow(row.id, { price: event.target.value })
                        }
                      />
                    </InputGroup>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min={0}
                      value={row.stock}
                      onChange={(event) =>
                        updateRow(row.id, { stock: event.target.value })
                      }
                      className="h-8 w-20 border-border bg-transparent"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min={1}
                      value={row.maxPerOrder}
                      onChange={(event) =>
                        updateRow(row.id, {
                          maxPerOrder: event.target.value,
                        })
                      }
                      className="h-8 w-20 border-border bg-transparent"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        aria-label="Save changes"
                        disabled={isSaving || !isRowDirty(row)}
                        onClick={() => handleUpdate(row)}
                      >
                        <Save className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Delete variant"
                        disabled={isSaving}
                        onClick={() => handleDelete(row)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}

            <TableRow>
              <TableCell className="align-top">
                {options.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    {options.map((option) =>
                      option.values.length === 0 ? (
                        <p
                          key={option.id}
                          className="text-xs text-muted-foreground"
                        >
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
                            className="h-8 w-32"
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
              <TableCell className="align-top">
                <Input
                  value={draftSku}
                  onChange={(event) => {
                    setSkuTouched(true)
                    setDraftSku(event.target.value)
                  }}
                  className="h-8 w-40 border-border bg-transparent font-mono text-xs"
                />
                {!skuTouched && draftSku && (
                  <p className="mt-1 text-[11px] text-muted-foreground italic">
                    Suggested from the combination
                  </p>
                )}
              </TableCell>
              <TableCell className="align-top">
                <InputGroup className="h-8 w-28">
                  <InputGroupAddon>
                    <InputGroupText>$</InputGroupText>
                  </InputGroupAddon>
                  <InputGroupInput
                    type="number"
                    min={0}
                    step="0.01"
                    value={draftPrice}
                    onChange={(event) => setDraftPrice(event.target.value)}
                  />
                </InputGroup>
              </TableCell>
              <TableCell className="align-top">
                <Input
                  type="number"
                  min={0}
                  value={draftStock}
                  onChange={(event) => setDraftStock(event.target.value)}
                  className="h-8 w-20 border-border bg-transparent"
                />
              </TableCell>
              <TableCell className="align-top">
                <Input
                  type="number"
                  min={1}
                  value={draftMaxPerOrder}
                  onChange={(event) => setDraftMaxPerOrder(event.target.value)}
                  className="h-8 w-20 border-border bg-transparent"
                />
              </TableCell>
              <TableCell className="align-top">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isCreating}
                  onClick={handleCreate}
                >
                  <Plus className="size-4" />
                  Add variant
                </Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          disabled={isFinishing}
          onClick={() => handleFinish("draft")}
        >
          Save as draft
        </Button>

        {rows.length === 0 ? (
          <Tooltip>
            <TooltipTrigger
              render={
                <span>
                  <Button type="button" disabled>
                    Publish
                  </Button>
                </span>
              }
            />
            <TooltipContent>
              Add at least one variant before publishing
            </TooltipContent>
          </Tooltip>
        ) : (
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  disabled={isFinishing}
                  onClick={() => handleFinish("active")}
                >
                  Publish
                </Button>
              }
            />
            <TooltipContent>
              Makes this product visible in the storefront
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  )
}
