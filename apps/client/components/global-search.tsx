"use client"

import { useRouter } from "next/navigation"
import { isSearchAvailable } from "@repo/search/availability"
import { createPublicSearchHistory } from "@repo/search/browser"
import { GlobalSearch } from "@repo/ui/global-search"
import { searchPublicCatalog } from "@/lib/search"

const history = createPublicSearchHistory()

export function StorefrontGlobalSearch({ className }: { className?: string }) {
  const router = useRouter()
  return (
    <GlobalSearch
      label="Search products and categories"
      available={isSearchAvailable(process.env.NODE_ENV)}
      search={searchPublicCatalog}
      history={history}
      onNavigate={(href) => router.push(href)}
      className={className}
    />
  )
}
