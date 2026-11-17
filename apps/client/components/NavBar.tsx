import Link from "next/link"
import { ThemeToggle } from "@repo/ui/theme-toggle"
import { AccountLink } from "@/features/account/components/account-link"
import { CartTrigger } from "./cart-trigger"
import { StorefrontNavigation } from "./storefront-navigation"
import { MobileNavigation } from "./mobile-navigation"
import { StorefrontGlobalSearch } from "./global-search"
import Logo from "./Logo"

export default function Navbar({ signedIn }: { signedIn: boolean }) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border bg-background">
      <div className="storefront-container grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-2 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:gap-x-6">
        <Link
          href="/"
          aria-label="ShopiNext home"
          className="flex h-20 shrink-0 items-center gap-2 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50 md:justify-self-start"
        >
          <Logo className="size-8 text-foreground" />
          <span className="hidden font-heading text-2xl font-extrabold tracking-[-0.06em] min-[480px]:inline md:hidden lg:inline">
            ShopiNext
          </span>
        </Link>
        <div className="hidden md:block">
          <StorefrontNavigation />
        </div>
        <div className="col-start-2 row-start-1 flex h-20 min-w-0 items-center justify-end gap-0.5 justify-self-end md:col-auto md:row-auto md:w-full md:gap-1">
          <StorefrontGlobalSearch className="min-w-0 md:mr-2 md:max-w-56 md:flex-1" />
          <CartTrigger />
          <ThemeToggle />
          <AccountLink signedIn={signedIn} />
          <MobileNavigation />
        </div>
      </div>
    </header>
  )
}
