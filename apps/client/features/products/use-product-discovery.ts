"use client"

import { useCallback, useEffect, useRef, useState, useTransition } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useDebounce } from "use-debounce"
import {
  normalizeProductQuery,
  productDiscoveryHref,
  productSortSchema,
  type ProductDiscovery,
} from "./discovery"

export function useProductDiscovery(discovery: ProductDiscovery) {
  const router = useRouter()
  const pathname = usePathname()
  const search = useSearchParams().toString()
  const href = search ? `${pathname}?${search}` : pathname
  const [draft, setDraft] = useState({ query: discovery.query, sourceHref: href })
  const [debouncedDraft, debounce] = useDebounce(draft, 300)
  const [isPending, startTransition] = useTransition()
  const observedHref = useRef(href)
  const requestedHref = useRef<string | null>(null)

  const navigate = useCallback((settings: ProductDiscovery, mode: "push" | "replace") => {
    const target = productDiscoveryHref(pathname, settings, search)
    if (target === href) return

    requestedHref.current = target
    startTransition(() => router[mode](target, { scroll: false }))
  }, [href, pathname, router, search])

  useEffect(() => {
    if (observedHref.current === href) return
    observedHref.current = href

    const ownNavigation = requestedHref.current === href
    requestedHref.current = null
    debounce.cancel()
    startTransition(() => {
      setDraft((previous) => ({
        query: ownNavigation ? previous.query : discovery.query,
        sourceHref: href,
      }))
    })
  }, [href, discovery.query, debounce])

  useEffect(() => {
    if (debouncedDraft.sourceHref !== href) return
    const query = normalizeProductQuery(debouncedDraft.query)
    if (query === discovery.query) return

    navigate({ query, sortBy: discovery.sortBy }, "replace")
  }, [debouncedDraft, href, discovery.query, discovery.sortBy, navigate])

  function changeSort(value: string) {
    const sortBy = productSortSchema.parse(value)
    debounce.cancel()
    navigate({ query: draft.query, sortBy }, "push")
  }

  function reset() {
    debounce.cancel()
    setDraft({ query: "", sourceHref: href })
    navigate({ query: "", sortBy: "newest" }, "push")
  }

  return {
    query: draft.query,
    setQuery: (query: string) => setDraft({ query, sourceHref: href }),
    changeSort,
    reset,
    isUpdating: isPending || normalizeProductQuery(draft.query) !== discovery.query,
    canReset: draft.query !== "" || discovery.query !== "" || discovery.sortBy !== "newest",
  }
}
