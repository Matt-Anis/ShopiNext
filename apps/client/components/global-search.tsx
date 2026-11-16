"use client"

import { useRouter } from "next/navigation"
import { isSearchAvailable } from "@repo/search/availability"
import { GlobalSearch } from "@repo/ui/global-search"
import { searchPublicCatalog } from "@/lib/search"

export function StorefrontGlobalSearch({ className }: { className?: string }) {
  const router = useRouter()
  return (
    <GlobalSearch
      label="Search products and categories"
      available={isSearchAvailable(process.env.NODE_ENV)}
      search={searchPublicCatalog}
      onNavigate={(href) => router.push(href)}
      className={className}
    />
  )
}
