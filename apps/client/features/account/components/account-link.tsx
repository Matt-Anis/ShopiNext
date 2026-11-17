"use client"

import { useSyncExternalStore } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { User } from "lucide-react"
import { buttonVariants } from "@repo/ui/button"
import { cn } from "@repo/ui/utils"
import { authClient } from "@/lib/auth-client"

const subscribe = () => () => {}
const getSnapshot = () => true
const getServerSnapshot = () => false

export function AccountLink({ signedIn }: { signedIn: boolean }) {
  const pathname = usePathname()
  const hydrated = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const { data: session, isPending } = authClient.useSession()
  const showAccount = hydrated && !isPending ? Boolean(session) : signedIn
  const isActive =
    pathname === "/profile" ||
    pathname.startsWith("/profile/") ||
    pathname === "/orders" ||
    pathname.startsWith("/orders/")

  if (showAccount) {
    return (
      <Link
        href="/profile"
        aria-label="Account"
        aria-current={isActive ? "location" : undefined}
        className={cn(
          buttonVariants({ variant: isActive ? "secondary" : "ghost" }),
          "size-11 px-0 md:w-auto md:px-3"
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
          "size-11 md:hidden"
        )}
        data-testid="signin-nav-button-mobile"
      >
        <User aria-hidden="true" />
      </Link>
      <Link
        href="/login"
        className={cn(
          buttonVariants({ variant: "outline" }),
          "hidden h-11 md:inline-flex"
        )}
        data-testid="signin-nav-button"
      >
        Sign in
      </Link>
    </>
  )
}
