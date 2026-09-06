"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Plus, Trash2 } from "lucide-react"

import {
  createProductVariant,
  updateProductVariant,
  deleteProductVariant,
  setProductStatus,
} from "@/features/products/actions"
import { toast } from "@repo/ui/toast"
import { Button } from "@repo/ui/button"
import { Input } from "@repo/ui/input"
import { Field, FieldLabel } from "@repo/ui/field"
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

function toRow(variant: Variant): Row {
  const saved = {
    sku: variant.sku,
    price: String(variant.price),
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
  const [draftPrice, setDraftPrice] = useState("0")
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

  function labelForValueIds(optionValueIds: string[]) {
    if (optionValueIds.length === 0) return "No options"
    return optionValueIds
      .map((id) => valueLookup.get(id)?.value ?? "?")
      .join(" / ")
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
          price: Number(draftPrice),
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
            setDraftPrice("0")
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
        price: Number(row.price),
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
      {rows.length > 0 && (
        <div className="rounded-2xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Options</TableHead>
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
                    <TableCell className="text-sm font-medium">
                      {labelForValueIds(row.optionValueIds)}
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
                      <Input
                        type="number"
                        min={0}
                        value={row.price}
                        onChange={(event) =>
                          updateRow(row.id, { price: event.target.value })
                        }
                        className="h-8 w-24 border-border bg-transparent"
                      />
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
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isSaving || !isRowDirty(row)}
                          onClick={() => handleUpdate(row)}
                        >
                          Save
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
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
            </TableBody>
          </Table>
        </div>
      )}

      <div className="rounded-2xl border border-border p-4">
        <h2 className="text-sm font-medium text-foreground/80">
          Add a variant
        </h2>

        {options.length > 0 && (
          <div className="mt-3 grid grid-cols-2 gap-3">
            {options.map((option) => (
              <Field key={option.id} className="gap-1.5">
                <FieldLabel htmlFor={`draft-option-${option.id}`} className="text-xs">
                  {option.name}
                </FieldLabel>
                {option.values.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No values yet.
                  </p>
                ) : (
                  <Combobox
                    items={option.values.map((v) => v.value)}
                    value={draftSelections[option.id] ?? null}
                    onValueChange={(name) =>
                      updateOptionSelection(option.id, name)
                    }
                  >
                    <ComboboxInput
                      id={`draft-option-${option.id}`}
                      showClear
                      placeholder={`Select ${option.name.toLowerCase()}`}
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
                )}
              </Field>
            ))}
          </div>
        )}

        <div className="mt-4 grid grid-cols-4 gap-2">
          <Field className="gap-1.5">
            <FieldLabel htmlFor="draft-sku" className="text-xs">
              SKU
            </FieldLabel>
            <Input
              id="draft-sku"
              value={draftSku}
              onChange={(event) => {
                setSkuTouched(true)
                setDraftSku(event.target.value)
              }}
              className="h-9 border-border bg-transparent font-mono text-sm"
            />
          </Field>
          <Field className="gap-1.5">
            <FieldLabel htmlFor="draft-price" className="text-xs">
              Price
            </FieldLabel>
            <Input
              id="draft-price"
              type="number"
              min={0}
              value={draftPrice}
              onChange={(event) => setDraftPrice(event.target.value)}
              className="h-9 border-border bg-transparent"
            />
          </Field>
          <Field className="gap-1.5">
            <FieldLabel htmlFor="draft-stock" className="text-xs">
              Stock
            </FieldLabel>
            <Input
              id="draft-stock"
              type="number"
              min={0}
              value={draftStock}
              onChange={(event) => setDraftStock(event.target.value)}
              className="h-9 border-border bg-transparent"
            />
          </Field>
          <Field className="gap-1.5">
            <FieldLabel htmlFor="draft-max-per-order" className="text-xs">
              Max/order
            </FieldLabel>
            <Input
              id="draft-max-per-order"
              type="number"
              min={1}
              value={draftMaxPerOrder}
              onChange={(event) => setDraftMaxPerOrder(event.target.value)}
              className="h-9 border-border bg-transparent"
            />
          </Field>
        </div>

        <Button
          type="button"
          variant="outline"
          className="mt-3"
          disabled={isCreating}
          onClick={handleCreate}
        >
          <Plus className="size-4" />
          Add variant
        </Button>
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
          <Button
            type="button"
            disabled={isFinishing}
            onClick={() => handleFinish("active")}
          >
            Publish
          </Button>
        )}
      </div>
    </div>
  )
}
