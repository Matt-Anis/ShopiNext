"use client"

import { useRouter } from "next/navigation"
import { isSearchAvailable } from "@repo/search/availability"
import { GlobalSearch } from "@repo/ui/global-search"
import { searchAdminCatalog } from "@/lib/search/client"
import { useCurrentRole } from "./role-provider"

export function AdminGlobalSearch() {
  const router = useRouter()
  const role = useCurrentRole()
  return (
    <GlobalSearch
      key={role}
      label="Search admin"
      available={isSearchAvailable(process.env.NODE_ENV)}
      search={searchAdminCatalog}
      onNavigate={(href) => router.push(href)}
      className="w-full"
    />
  )
}
