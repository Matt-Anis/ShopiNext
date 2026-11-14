import type { ReactNode } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { buttonVariants } from "@repo/ui/button"
import { Footer } from "@repo/ui/footer"
import Logo from "@/components/Logo"
import { storefrontFooter } from "@/lib/storefront-footer"

export default function PolicyLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh flex-1 flex-col">
      <header className="border-b border-border">
        <nav
          aria-label="Policy navigation"
          className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 md:px-10"
        >
          <Link
            href="/"
            aria-label="ShopiNext home"
            className="flex items-center gap-2 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <Logo className="size-7 text-foreground" />
            <span className="font-heading text-lg font-semibold tracking-tight">
              ShopiNext
            </span>
          </Link>
          <Link href="/" className={buttonVariants({ variant: "outline" })}>
            <ArrowLeft aria-hidden="true" />
            Back to shop
          </Link>
        </nav>
      </header>
      {children}
      <Footer {...storefrontFooter} linkComponent={Link} />
    </div>
  )
}
