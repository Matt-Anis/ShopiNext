import Link from "next/link"
import { ThemeToggle } from "@repo/ui/theme-toggle"

import Logo from "@/components/Logo"

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <aside className="hidden flex-col justify-between gap-16 bg-[#1b1c19] p-12 text-[#f5f4eb] lg:flex xl:p-16">
        <Link
          href="/"
          aria-label="ShopiNext home"
          className="flex w-fit items-center gap-3 rounded-md font-heading text-3xl font-extrabold tracking-[-0.06em] outline-none focus-visible:ring-3 focus-visible:ring-primary"
        >
          <Logo className="size-10 text-primary" />
          ShopiNext
        </Link>
        <div>
          <p className="mb-8 font-mono text-xs tracking-[0.16em] text-[#b4b8a6] uppercase">
            Everyday discoveries
          </p>
          <p className="font-heading text-[clamp(4rem,6vw,6.5rem)] leading-[0.95] font-black tracking-[-0.06em]">
            Your next
            <br />
            good <span className="text-primary">find.</span>
          </p>
          <p className="mt-8 max-w-sm text-lg leading-relaxed text-[#b4b8a6]">
            Everyday essentials. Unexpected favourites. A little more you.
          </p>
        </div>
        <p className="font-mono text-xs tracking-wider text-[#b4b8a6] uppercase">
          Stay curious. Keep exploring.
        </p>
      </aside>
      <div className="flex min-w-0 flex-col px-4 py-6 sm:px-8 lg:px-12">
        <header className="mx-auto flex w-full max-w-md items-center justify-between gap-4">
          <Link
            href="/"
            aria-label="ShopiNext home"
            className="flex items-center gap-2 rounded-md font-heading text-2xl font-extrabold tracking-[-0.06em] outline-none focus-visible:ring-3 focus-visible:ring-ring lg:invisible"
          >
            <Logo className="size-8" />
            ShopiNext
          </Link>
          <ThemeToggle />
        </header>
        <main className="mx-auto my-auto w-full max-w-md storefront-panels py-10 auth-content">
          {children}
        </main>
        <Link
          href="/"
          className="mx-auto inline-flex min-h-11 items-center rounded-md text-sm text-muted-foreground underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:ring-3 focus-visible:ring-ring"
        >
          Back to shop
        </Link>
      </div>
    </div>
  )
}
