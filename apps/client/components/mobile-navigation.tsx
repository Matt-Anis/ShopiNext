"use client"

import { useEffect, useState } from "react"
import { Menu } from "lucide-react"
import { Button } from "@repo/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@repo/ui/sheet"
import { StorefrontNavigation } from "./storefront-navigation"

export function MobileNavigation() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 768px)")

    function closeOnDesktop(event: MediaQueryListEvent) {
      if (event.matches) setOpen(false)
    }

    desktop.addEventListener("change", closeOnDesktop)
    return () => desktop.removeEventListener("change", closeOnDesktop)
  }, [])

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="size-10 md:hidden"
            aria-label="Open navigation"
            data-testid="mobile-nav-trigger"
          />
        }
      >
        <Menu aria-hidden="true" />
      </SheetTrigger>
      <SheetContent
        side="right"
        className="max-w-xs overflow-y-auto"
        data-testid="mobile-nav-content"
      >
        <SheetHeader className="border-b border-border pr-16">
          <SheetTitle>Menu</SheetTitle>
          <SheetDescription className="sr-only">
            Browse products and categories.
          </SheetDescription>
        </SheetHeader>
        <div className="p-4">
          <StorefrontNavigation
            layout="vertical"
            onSelect={() => setOpen(false)}
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}
