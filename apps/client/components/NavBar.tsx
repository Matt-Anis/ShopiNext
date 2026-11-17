import Link from "next/link"
import { AccountLink } from "@/features/account/components/account-link"
import { CartTrigger } from "./cart-trigger"
import { StorefrontNavigation } from "./storefront-navigation"
import { MobileNavigation } from "./mobile-navigation"
import { StorefrontGlobalSearch } from "./global-search"
import Logo from "./Logo"

export default function Navbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border bg-background/95 backdrop-blur-md">
      <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 px-4 sm:gap-x-3 sm:px-6 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:gap-x-6 md:px-10">
        <Link
          href="/"
          aria-label="ShopiNext home"
          className="flex h-16 shrink-0 items-center gap-2 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50 md:justify-self-start"
        >
          <Logo className="size-8 text-foreground" />
          <span className="font-heading text-lg font-semibold tracking-tight md:hidden lg:inline">
            ShopiNext
          </span>
        </Link>
        <div className="hidden md:block md:justify-self-center">
          <StorefrontNavigation />
        </div>
        <div className="col-start-2 row-start-1 flex h-16 items-center justify-end gap-1 justify-self-end md:col-auto md:row-auto md:w-full">
          <StorefrontGlobalSearch className="min-w-0 md:mr-2 md:max-w-64 md:flex-1" />
          <CartTrigger />
          <AccountLink />
          <MobileNavigation />
        </div>
      </div>
    </header>
  )
}
