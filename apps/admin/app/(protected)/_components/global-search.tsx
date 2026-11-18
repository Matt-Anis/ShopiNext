"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useId, useMemo, useRef, useState } from "react"
import { Search, X } from "lucide-react"
import { isSearchAvailable } from "@repo/search/availability"
import { createAdminSearchHistory } from "@repo/search/browser"
import { Button } from "@repo/ui/button"
import { GlobalSearch } from "@repo/ui/global-search"
import { cn } from "@repo/ui/utils"
import { searchAdminCatalog } from "@/lib/search/client"
import { useCurrentRole } from "./role-provider"

const searchAvailable = isSearchAvailable(process.env.NODE_ENV)
const openSearchEvent = "shopinext:open-admin-search"

export function FindCustomerShortcut() {
  if (!searchAvailable) {
    return (
      <Button variant="outline" className="h-11" nativeButton={false} render={<Link href="/customers" />}>
        <Search aria-hidden="true" />
        Find customer
      </Button>
    )
  }

  return (
    <Button variant="outline" className="h-11" onClick={() => window.dispatchEvent(new Event(openSearchEvent))}>
      <Search aria-hidden="true" />
      Find customer
    </Button>
  )
}

export function AdminGlobalSearch({ accountId }: { accountId: string }) {
  const router = useRouter()
  const role = useCurrentRole()
  const inputRef = useRef<HTMLInputElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const inputContainerId = useId()
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const history = useMemo(
    () => createAdminSearchHistory(accountId),
    [accountId]
  )

  useEffect(() => {
    if (mobileSearchOpen) inputRef.current?.focus()
  }, [mobileSearchOpen])

  useEffect(() => {
    function openSearch() {
      const input = inputRef.current
      if (input?.getClientRects().length) {
        input.focus()
      } else {
        setMobileSearchOpen(true)
      }
    }

    window.addEventListener(openSearchEvent, openSearch)
    return () => window.removeEventListener(openSearchEvent, openSearch)
  }, [])

  function dismissMobileSearch() {
    if (!mobileSearchOpen) return
    setMobileSearchOpen(false)
    requestAnimationFrame(() => triggerRef.current?.focus())
  }

  return (
    <div className="min-w-0">
      <Button
        ref={triggerRef}
        variant="ghost"
        size="icon"
        type="button"
        className="size-11 text-muted-foreground md:hidden"
        aria-label={mobileSearchOpen ? "Close search" : "Search admin"}
        aria-expanded={mobileSearchOpen}
        aria-controls={inputContainerId}
        onClick={mobileSearchOpen ? dismissMobileSearch : () => setMobileSearchOpen(true)}
      >
        {mobileSearchOpen ? <X aria-hidden="true" /> : <Search aria-hidden="true" />}
      </Button>
      <div
        id={inputContainerId}
        className={cn(
          "max-md:absolute max-md:inset-x-0 max-md:top-full max-md:border-b max-md:border-border max-md:px-4 max-md:py-3 sm:max-md:px-6",
          mobileSearchOpen ? "admin-search-open" : "hidden md:block"
        )}
      >
        <GlobalSearch
          key={`${accountId}:${role}`}
          label="Search admin"
          available={searchAvailable}
          search={searchAdminCatalog}
          history={history}
          inputRef={inputRef}
          onDismiss={dismissMobileSearch}
          onNavigate={(href) => {
            setMobileSearchOpen(false)
            router.push(href)
          }}
          className="w-full"
        />
      </div>
    </div>
  )
}
