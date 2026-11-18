import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { ShopiNextLogo } from "@repo/ui/shopinext-logo"

import { auth } from "@/lib/auth"
import { LoginForm } from "./_components/login-form"

export default async function LoginPage() {
  const session = await auth.api.getSession({ headers: await headers() })

  if (session) {
    redirect("/")
  }

  return (
    <main className="flex min-h-svh flex-col bg-background lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="flex shrink-0 items-center justify-center gap-3 border-b-2 border-brand bg-sidebar bg-[radial-gradient(ellipse_at_center,var(--sidebar-accent),transparent_72%)] px-5 py-5 lg:flex-col lg:gap-8 lg:border-r-2 lg:border-b-0 lg:px-10">
        <ShopiNextLogo className="size-9 shrink-0 text-brand lg:size-[clamp(12rem,24vw,21rem)]" />
        <span className="text-lg font-semibold tracking-tight text-sidebar-foreground lg:text-3xl">
          ShopiNext Admin
        </span>
      </div>
      <div className="flex min-w-0 flex-1 items-center justify-center px-5 py-10 sm:px-10">
        <LoginForm className="w-full max-w-sm" />
      </div>
    </main>
  )
}
