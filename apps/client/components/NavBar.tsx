import Link from "next/link"
import { AccountLink } from "@/features/account/components/account-link"
import { CartTrigger } from "./cart-trigger"
import { StorefrontNavigation } from "./storefront-navigation"
import { MobileNavigation } from "./mobile-navigation"
import Logo from "./Logo"

export default function Navbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border bg-background/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-4 sm:gap-3 sm:px-6 md:gap-6 md:px-10">
        <Link
          href="/"
          aria-label="ShopiNext home"
          className="flex shrink-0 items-center gap-2 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <Logo className="size-8 text-foreground" />
          <span className="font-heading text-lg font-semibold tracking-tight">
            ShopiNext
          </span>
        </Link>
        <div className="hidden md:block">
          <StorefrontNavigation />
        </div>
        <div className="ml-auto flex items-center gap-1">
          <CartTrigger />
          <AccountLink />
          <MobileNavigation />
        </div>
      </div>
    </header>
  )
}
