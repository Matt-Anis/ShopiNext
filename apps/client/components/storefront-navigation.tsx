"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@repo/ui/button"

const storefrontLinks = [
  { href: "/#products", label: "Shop", paths: ["/", "/products"] },
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
          layout === "vertical"
            ? "flex flex-col gap-2"
            : "flex items-center gap-1"
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
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className={
                  layout === "vertical"
                    ? "h-12 w-full justify-start rounded-xl px-4 text-base"
                    : "h-10"
                }
                nativeButton={false}
                render={
                  <Link
                    href={href}
                    aria-current={isActive ? "location" : undefined}
                    onClick={onSelect}
                  />
                }
              >
                {label}
              </Button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
