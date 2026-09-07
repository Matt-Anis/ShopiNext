"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import {
  createProductVariant,
  updateProductVariant,
  deleteProductVariant,
  setProductStatus,
} from "@/features/products/actions"
import { toast } from "@repo/ui/toast"
import { Button } from "@repo/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@repo/ui/tooltip"
import { ConfirmDialog } from "@repo/ui/confirm-dialog"
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@repo/ui/table"

import {
  displayToCents,
  labelsForValueIds,
  toRow,
  type Option,
  type Row,
  type ValueLookup,
  type Variant,
} from "./variant-utils"
import { VariantRow } from "./variant-row"
import { NewVariantRow, type NewVariantDraft } from "./new-variant-row"

interface Step3FormProps {
  productId: string
  productSlug: string
  options: Option[]
  variants: Variant[]
}

type PendingAction =
  | { kind: "create-variant"; draft: NewVariantDraft }
  | { kind: "delete-variant"; row: Row }

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
  const [isCreating, setIsCreating] = useState(false)
  const [draftResetCount, setDraftResetCount] = useState(0)
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(
    null
  )

  const valueLookup: ValueLookup = useMemo(() => {
    const map: ValueLookup = new Map()
    for (const option of options) {
      for (const value of option.values) {
        map.set(value.id, { value: value.value, optionName: option.name })
      }
    }
    return map
  }, [options])

  function updateRow(id: string, patch: Partial<Row>) {
    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, ...patch } : row))
    )
  }

  function handleNewVariantRequest(draft: NewVariantDraft) {
    setPendingAction({ kind: "create-variant", draft })
  }

  function confirmCreate(draft: NewVariantDraft) {
    setIsCreating(true)
    startTransition(async () => {
      const promise = createProductVariant(
        productId,
        {
          sku: draft.sku,
          price: displayToCents(draft.price),
          stock: Number(draft.stock),
          maxPerOrder: Number(draft.maxPerOrder),
        },
        draft.optionValueIds
      )

      await toast
        .promise(promise, {
          loading: { title: "Creating variant..." },
          success: (variant) => {
            setRows((prev) => [
              ...prev,
              toRow({ ...variant, optionValueIds: draft.optionValueIds }),
            ])
            setPendingAction(null)
            setDraftResetCount((count) => count + 1)
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

  function requestDelete(row: Row) {
    setPendingAction({ kind: "delete-variant", row })
  }

  function confirmDelete(row: Row) {
    setSavingId(row.id)
    startTransition(async () => {
      const promise = deleteProductVariant(productId, row.id)

      await toast
        .promise(promise, {
          loading: { title: "Deleting variant..." },
          success: () => {
            setRows((prev) => prev.filter((r) => r.id !== row.id))
            setPendingAction(null)
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

  const dialogTitle =
    pendingAction?.kind === "delete-variant" ? "Delete variant" : "Create variant"

  const dialogDescription =
    pendingAction?.kind === "delete-variant"
      ? `Delete "${pendingAction.row.sku}"${
          pendingAction.row.optionValueIds.length
            ? ` (${labelsForValueIds(valueLookup, pendingAction.row.optionValueIds).join(", ")})`
            : ""
        }? This can't be undone.`
      : pendingAction?.kind === "create-variant"
        ? `Create "${pendingAction.draft.sku}"${
            pendingAction.draft.optionValueIds.length
              ? ` (${labelsForValueIds(valueLookup, pendingAction.draft.optionValueIds).join(", ")})`
              : ""
          }?`
        : ""

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
          <span className="text-xs text-muted-foreground">Prices in USD</span>
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
            {rows.map((row) => (
              <VariantRow
                key={row.id}
                row={row}
                valueLookup={valueLookup}
                isSaving={savingId === row.id}
                onUpdate={(patch) => updateRow(row.id, patch)}
                onSave={() => handleUpdate(row)}
                onDelete={() => requestDelete(row)}
              />
            ))}

            <NewVariantRow
              key={draftResetCount}
              productSlug={productSlug}
              options={options}
              initialSku={draftResetCount === 0 ? "" : productSlug}
              isCreating={isCreating}
              onCreate={handleNewVariantRequest}
            />
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

      <ConfirmDialog
        open={pendingAction !== null}
        onOpenChange={(open) => !open && setPendingAction(null)}
        title={dialogTitle}
        description={dialogDescription}
        confirmLabel={pendingAction?.kind === "delete-variant" ? "Delete" : "Create"}
        destructive={pendingAction?.kind === "delete-variant"}
        disabled={isCreating || savingId !== null}
        onConfirm={() => {
          if (!pendingAction) return
          if (pendingAction.kind === "delete-variant") {
            confirmDelete(pendingAction.row)
          } else {
            confirmCreate(pendingAction.draft)
          }
        }}
      />
    </div>
  )
}
