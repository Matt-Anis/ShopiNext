"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { User } from "lucide-react"
import { buttonVariants } from "@repo/ui/button"
import { cn } from "@repo/ui/utils"
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
      <Link
        href="/profile"
        aria-label="Account"
        aria-current={isActive ? "location" : undefined}
        className={cn(
          buttonVariants({ variant: isActive ? "secondary" : "ghost" }),
          "size-10 px-0 md:w-auto md:px-3"
        )}
        data-testid="account-nav-link"
      >
        <User aria-hidden="true" />
        <span className="hidden md:inline">Account</span>
      </Link>
    )
  }

  return (
    <>
      <Link
        href="/login"
        aria-label="Sign in"
        className={cn(
          buttonVariants({ variant: "ghost", size: "icon" }),
          "size-10 md:hidden"
        )}
        data-testid="signin-nav-button-mobile"
      >
        <User aria-hidden="true" />
      </Link>
      <Link
        href="/login"
        className={cn(
          buttonVariants({ variant: "outline" }),
          "hidden h-10 md:inline-flex"
        )}
        data-testid="signin-nav-button"
      >
        Sign in
      </Link>
    </>
  )
}
