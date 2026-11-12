import Link from "next/link"
import { Button } from "@repo/ui/button"

const accountLinks = [
  { href: "/profile", label: "Profile" },
  { href: "/profile/settings", label: "Settings" },
  { href: "/orders", label: "Orders" },
] as const

type AccountPath = (typeof accountLinks)[number]["href"]

export function AccountNavigation({ currentPath }: { currentPath: AccountPath }) {
  return (
    <nav aria-label="Account" className="mb-8">
      <ul className="flex flex-wrap gap-2">
        {accountLinks.map(({ href, label }) => (
          <li key={href}>
            <Button
              variant={currentPath === href ? "secondary" : "ghost"}
              nativeButton={false}
              render={
                <Link
                  href={href}
                  aria-current={currentPath === href ? "page" : undefined}
                />
              }
            >
              {label}
            </Button>
          </li>
        ))}
      </ul>
    </nav>
  )
}
