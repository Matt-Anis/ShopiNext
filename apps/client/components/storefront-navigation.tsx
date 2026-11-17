"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@repo/ui/utils"

const storefrontLinks = [
  { href: "/#products", label: "All products", paths: ["/", "/products"] },
  { href: "/categories", label: "Categories", paths: ["/categories"] },
]

type StorefrontNavigationProps = {
  layout?: "horizontal" | "vertical"
  onSelect?: () => void
}

export function StorefrontNavigation({
  layout = "horizontal",
  onSelect,
}: StorefrontNavigationProps) {
  const pathname = usePathname()

  return (
    <nav aria-label="Store">
      <ul
        className={
          layout === "vertical" ? "flex flex-col" : "flex items-center gap-5"
        }
      >
        {storefrontLinks.map(({ href, label, paths }) => {
          const isActive = paths.some(
            (path) =>
              pathname === path ||
              (path !== "/" && pathname.startsWith(`${path}/`))
          )

          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={isActive ? "location" : undefined}
                onClick={onSelect}
                className={cn(
                  "inline-flex items-center border-b-2 transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                  isActive
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground hover:border-foreground/40 hover:text-foreground",
                  layout === "vertical"
                    ? "min-h-20 w-full font-heading text-3xl font-bold tracking-tight"
                    : "min-h-11 text-sm font-semibold whitespace-nowrap"
                )}
              >
                {label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
