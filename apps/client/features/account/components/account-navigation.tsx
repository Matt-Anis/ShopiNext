"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Settings, ShoppingBag, UserRound } from "lucide-react"
import { buttonVariants } from "@repo/ui/button"
import { cn } from "@repo/ui/utils"

const accountLinks = [
  { href: "/profile", label: "Profile", icon: UserRound },
  { href: "/orders", label: "Orders", icon: ShoppingBag },
  { href: "/profile/settings", label: "Settings", icon: Settings },
] as const

export function AccountNavigation() {
  const pathname = usePathname()

  return (
    <nav aria-label="Account" className="min-w-0 flex-1 md:flex-none">
      <ul className="grid grid-cols-3 gap-1 rounded-2xl bg-muted/50 p-1 md:flex md:flex-col md:bg-transparent md:p-0">
        {accountLinks.map(({ href, label, icon: Icon }) => {
          const isActive =
            pathname === href ||
            (href !== "/profile" && pathname.startsWith(`${href}/`))

          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  buttonVariants({ variant: isActive ? "secondary" : "ghost" }),
                  "h-10 w-full rounded-xl px-2 md:justify-start md:px-3"
                )}
              >
                <Icon className="hidden md:block" aria-hidden="true" />
                {label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
