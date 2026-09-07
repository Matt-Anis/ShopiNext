export interface OptionValue {
  id: string
  value: string
}

export interface Option {
  id: string
  name: string
  values: OptionValue[]
}

export interface Variant {
  id: string
  sku: string
  price: number
  stock: number
  maxPerOrder: number
  optionValueIds: string[]
}

export interface Row {
  id: string
  optionValueIds: string[]
  sku: string
  price: string
  stock: string
  maxPerOrder: string
  saved: { sku: string; price: string; stock: string; maxPerOrder: string }
}

export type ValueLookup = Map<string, { value: string; optionName: string }>

export function centsToDisplay(cents: number) {
  return (cents / 100).toFixed(2)
}

export function displayToCents(display: string) {
  const value = Number(display)
  return Number.isFinite(value) ? Math.round(value * 100) : 0
}

export function toRow(variant: Variant): Row {
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

export function isRowDirty(row: Row) {
  return (
    row.sku !== row.saved.sku ||
    row.price !== row.saved.price ||
    row.stock !== row.saved.stock ||
    row.maxPerOrder !== row.saved.maxPerOrder
  )
}

export function slugifyLabel(label: string) {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function labelsForValueIds(
  valueLookup: ValueLookup,
  optionValueIds: string[]
) {
  return optionValueIds.map((id) => valueLookup.get(id)?.value ?? "?")
}
