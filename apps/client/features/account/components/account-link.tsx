"use client"

import Link from "next/link"
import { User } from "lucide-react"
import { Button } from "@repo/ui/button"
import { Skeleton } from "@repo/ui/skeleton"
import { authClient } from "@/lib/auth-client"

export function AccountLink() {
  const { data: session, isPending } = authClient.useSession()

  if (isPending) {
    return <Skeleton className="size-9 rounded-full md:w-24" />
  }

  if (session) {
    return (
      <Button
        variant="ghost"
        nativeButton={false}
        className="size-9 px-0 md:w-auto md:px-3"
        render={<Link href="/profile" aria-label="Account" />}
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
        className="md:hidden"
        variant="ghost"
        size="icon"
        nativeButton={false}
        render={<Link href="/login" aria-label="Sign in" />}
        data-testid="signin-nav-button-mobile"
      >
        <User aria-hidden="true" />
      </Button>
      <Button
        className="hidden md:inline-flex"
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
