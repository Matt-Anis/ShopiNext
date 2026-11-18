"use client"

import { Save, Trash2 } from "lucide-react"

import { Button } from "@repo/ui/button"
import { Badge } from "@repo/ui/badge"
import { Input } from "@repo/ui/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@repo/ui/input-group"
import { TableCell, TableRow } from "@repo/ui/table"

import { isRowDirty, labelsForValueIds, type Row, type ValueLookup } from "./variant-utils"

interface VariantRowProps {
  row: Row
  valueLookup: ValueLookup
  isSaving: boolean
  onUpdate: (patch: Partial<Row>) => void
  onSave: () => void
  onDelete: () => void
}

export function VariantRow({
  row,
  valueLookup,
  isSaving,
  onUpdate,
  onSave,
  onDelete,
}: VariantRowProps) {
  return (
    <TableRow role="row">
      <TableCell role="cell">
        {row.optionValueIds.length === 0 ? (
          <span className="text-sm text-muted-foreground">No options</span>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {labelsForValueIds(valueLookup, row.optionValueIds).map(
              (label, index) => (
                <Badge key={index} variant="secondary">
                  {label}
                </Badge>
              )
            )}
          </div>
        )}
      </TableCell>
      <TableCell role="cell">
        <span aria-hidden="true" className="mb-1 block text-xs font-medium text-muted-foreground lg:hidden">SKU</span>
        <Input
          aria-label="SKU"
          value={row.sku}
          onChange={(event) => onUpdate({ sku: event.target.value })}
          className="h-8 w-40 border-border bg-transparent font-mono text-xs max-lg:h-11 max-lg:w-full"
        />
      </TableCell>
      <TableCell role="cell">
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
            value={row.price}
            onChange={(event) => onUpdate({ price: event.target.value })}
          />
        </InputGroup>
      </TableCell>
      <TableCell role="cell">
        <span aria-hidden="true" className="mb-1 block text-xs font-medium text-muted-foreground lg:hidden">Stock</span>
        <Input
          aria-label="Stock"
          type="number"
          min={0}
          value={row.stock}
          onChange={(event) => onUpdate({ stock: event.target.value })}
          className="h-8 w-20 border-border bg-transparent max-lg:h-11 max-lg:w-full"
        />
      </TableCell>
      <TableCell role="cell">
        <span aria-hidden="true" className="mb-1 block text-xs font-medium text-muted-foreground lg:hidden">Max per order</span>
        <Input
          aria-label="Max per order"
          type="number"
          min={1}
          value={row.maxPerOrder}
          onChange={(event) => onUpdate({ maxPerOrder: event.target.value })}
          className="h-8 w-20 border-border bg-transparent max-lg:h-11 max-lg:w-full"
        />
      </TableCell>
      <TableCell role="cell">
        <div className="flex gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className="max-lg:size-11"
            aria-label="Save changes"
            disabled={isSaving || !isRowDirty(row)}
            onClick={onSave}
          >
            <Save className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="max-lg:size-11"
            aria-label="Delete variant"
            disabled={isSaving}
            onClick={onDelete}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}
