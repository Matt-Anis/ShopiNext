"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@repo/ui/button"

const accountLinks = [
  { href: "/profile", label: "Profile" },
  { href: "/orders", label: "Orders" },
  { href: "/profile/settings", label: "Settings" },
] as const

export function AccountNavigation() {
  const pathname = usePathname()

  return (
    <nav aria-label="Account" className="mb-8">
      <ul className="flex flex-wrap gap-2">
        {accountLinks.map(({ href, label }) => {
          const isActive =
            pathname === href ||
            (href !== "/profile" && pathname.startsWith(`${href}/`))

          return (
            <li key={href}>
              <Button
                variant={isActive ? "secondary" : "ghost"}
                nativeButton={false}
                render={
                  <Link
                    href={href}
                    aria-current={isActive ? "page" : undefined}
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
