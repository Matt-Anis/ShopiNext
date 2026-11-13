"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { User } from "lucide-react"
import { Button } from "@repo/ui/button"
import { Skeleton } from "@repo/ui/skeleton"
import { authClient } from "@/lib/auth-client"

export function AccountLink() {
  const pathname = usePathname()
  const { data: session, isPending } = authClient.useSession()
  const isActive =
    pathname === "/profile" ||
    pathname.startsWith("/profile/") ||
    pathname === "/orders" ||
    pathname.startsWith("/orders/")

  if (isPending) {
    return <Skeleton className="size-10 rounded-full md:w-24" />
  }

  if (session) {
    return (
      <Button
        variant={isActive ? "secondary" : "ghost"}
        nativeButton={false}
        className="size-10 px-0 md:w-auto md:px-3"
        render={
          <Link
            href="/profile"
            aria-label="Account"
            aria-current={isActive ? "location" : undefined}
          />
        }
        data-testid="account-nav-link"
      >
        <User aria-hidden="true" />
        <span className="hidden md:inline">Account</span>
      </Button>
    )
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="size-10 md:hidden"
        nativeButton={false}
        render={<Link href="/login" aria-label="Sign in" />}
        data-testid="signin-nav-button-mobile"
      >
        <User aria-hidden="true" />
      </Button>
      <Button
        className="hidden h-10 md:inline-flex"
        variant="outline"
        nativeButton={false}
        render={<Link href="/login" />}
        data-testid="signin-nav-button"
      >
        Sign in
      </Button>
    </>
  )
}
