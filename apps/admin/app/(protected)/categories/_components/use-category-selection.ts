"use client"

import { useSearchParams } from "next/navigation"

function updateSelection(
  id: string | null,
  method: "pushState" | "replaceState"
) {
  const url = new URL(window.location.href)
  if (id) url.searchParams.set("categoryId", id)
  else url.searchParams.delete("categoryId")
  window.history[method](null, "", `${url.pathname}${url.search}${url.hash}`)
}

export function useCategorySelection() {
  const params = useSearchParams()
  return {
    categoryId: params.get("categoryId"),
    selectCategory: (id: string) => updateSelection(id, "pushState"),
    clearCategory: () => updateSelection(null, "replaceState"),
  }
}
