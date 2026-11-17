"use client"

import { useRouter } from "next/navigation"
import { useMemo } from "react"
import { isSearchAvailable } from "@repo/search/availability"
import { createAdminSearchHistory } from "@repo/search/browser"
import { GlobalSearch } from "@repo/ui/global-search"
import { searchAdminCatalog } from "@/lib/search/client"
import { useCurrentRole } from "./role-provider"

export function AdminGlobalSearch({ accountId }: { accountId: string }) {
  const router = useRouter()
  const role = useCurrentRole()
  const history = useMemo(
    () => createAdminSearchHistory(accountId),
    [accountId]
  )
  return (
    <GlobalSearch
      key={`${accountId}:${role}`}
      label="Search admin"
      available={isSearchAvailable(process.env.NODE_ENV)}
      search={searchAdminCatalog}
      history={history}
      onNavigate={(href) => router.push(href)}
      className="w-full"
    />
  )
}
