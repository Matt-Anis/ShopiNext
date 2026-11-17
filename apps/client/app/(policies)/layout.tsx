import type { ReactNode } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { buttonVariants } from "@repo/ui/button"
import { Footer } from "@repo/ui/footer"
import { ThemeToggle } from "@repo/ui/theme-toggle"
import Logo from "@/components/Logo"
import { storefrontFooter } from "@/lib/storefront-footer"

export default function PolicyLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh flex-1 flex-col">
      <header className="border-b border-border">
        <nav
          aria-label="Policy navigation"
          className="storefront-container flex min-h-20 items-center justify-between gap-4"
        >
          <Link
            href="/"
            aria-label="ShopiNext home"
            className="flex items-center gap-2 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <Logo className="size-8 text-foreground" />
            <span className="hidden font-heading text-2xl font-extrabold tracking-[-0.06em] min-[480px]:inline">
              ShopiNext
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/" className={buttonVariants({ variant: "outline" })}>
              <ArrowLeft aria-hidden="true" />
              Back to shop
            </Link>
          </div>
        </nav>
      </header>
      {children}
      <Footer
        {...storefrontFooter}
        linkComponent={Link}
        className="[&>div]:max-w-[1440px] md:[&>div]:px-6 lg:[&>div]:px-10"
      />
    </div>
  )
}
