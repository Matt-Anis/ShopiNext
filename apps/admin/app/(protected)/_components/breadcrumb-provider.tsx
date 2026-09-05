"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"

export interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbContextValue {
  items: BreadcrumbItem[]
  setItems: (items: BreadcrumbItem[]) => void
}

const BreadcrumbContext = createContext<BreadcrumbContextValue | null>(null)

function itemsEqual(a: BreadcrumbItem[], b: BreadcrumbItem[]) {
  return (
    a.length === b.length &&
    a.every((item, i) => item.label === b[i]?.label && item.href === b[i]?.href)
  )
}

export function BreadcrumbProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [items, setItemsState] = useState<BreadcrumbItem[]>([])

  const setItems = useCallback((next: BreadcrumbItem[]) => {
    setItemsState((current) => (itemsEqual(current, next) ? current : next))
  }, [])

  const value = useMemo(() => ({ items, setItems }), [items, setItems])

  return (
    <BreadcrumbContext.Provider value={value}>
      {children}
    </BreadcrumbContext.Provider>
  )
}

function useBreadcrumbContext() {
  const ctx = useContext(BreadcrumbContext)
  if (!ctx) {
    throw new Error("useBreadcrumb must be used within a BreadcrumbProvider")
  }
  return ctx
}

export function useBreadcrumbItems() {
  return useBreadcrumbContext().items
}

function itemsKey(items: BreadcrumbItem[]) {
  return items.map((item) => `${item.label}|${item.href ?? ""}`).join(">")
}

export function useBreadcrumb(items: BreadcrumbItem[]) {
  const { setItems } = useBreadcrumbContext()
  const key = itemsKey(items)

  useEffect(() => {
    setItems(items)
    return () => setItems([])
    // `key` (derived from `items` above, in this same render) is what
    // should actually trigger this effect — not `items`' own reference,
    // which changes on every render for callers that build it inline.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, setItems])
}
