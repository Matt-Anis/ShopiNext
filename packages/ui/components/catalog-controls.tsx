"use client"

import { useId } from "react"
import { Button } from "./button"
import { Input } from "./input"
import { Label } from "./label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select"

type CatalogControlsProps = {
  query: string
  sortBy: string
  sortOptions: readonly { value: string; label: string }[]
  maxQueryLength: number
  onQueryChange: (query: string) => void
  onSortChange: (sortBy: string) => void
  onReset: () => void
  busy: boolean
  canReset: boolean
}

export function CatalogControls({
  query, sortBy, sortOptions, maxQueryLength,
  onQueryChange, onSortChange, onReset, busy, canReset,
}: CatalogControlsProps) {
  const id = useId()

  return (
    <div className="mb-8" role="group" aria-label="Product discovery">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-2">
          <Label htmlFor={`${id}-query`}>Filter products by name</Label>
          <Input
            id={`${id}-query`}
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            maxLength={maxQueryLength}
            placeholder="Product name"
          />
        </div>
        <div className="space-y-2">
          <Label id={`${id}-sort-label`} htmlFor={`${id}-sort`}>Sort products</Label>
          <Select value={sortBy} items={[...sortOptions]} onValueChange={(value) => { if (value) onSortChange(value) }}>
            <SelectTrigger id={`${id}-sort`} aria-labelledby={`${id}-sort-label`} className="w-full sm:w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button type="button" variant="outline" onClick={onReset} disabled={!canReset}>
          Reset filters
        </Button>
      </div>
      <p role="status" className="mt-2 min-h-5 text-sm text-muted-foreground">
        {busy ? "Updating products…" : ""}
      </p>
    </div>
  )
}
