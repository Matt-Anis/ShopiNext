"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@repo/ui/button"

const storefrontLinks = [
  { href: "/#products", label: "Shop", paths: ["/", "/products"] },
  { href: "/categories", label: "Categories", paths: ["/categories"] },
]

export function StorefrontNavigation() {
  const pathname = usePathname()

  return (
    <nav aria-label="Store">
      <ul className="flex items-center gap-1">
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
                nativeButton={false}
                render={
                  <Link
                    href={href}
                    aria-current={isActive ? "location" : undefined}
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
