import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { cn } from "@repo/ui/utils"

import { auth } from "@/lib/auth"
import { LoginForm } from "./_components/login-form"
import styles from "./login.module.css"

export default async function LoginPage() {
  const session = await auth.api.getSession({ headers: await headers() })

  if (session) {
    redirect("/")
  }

  return (
    <main className="flex min-h-svh flex-col bg-background lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div
        className={cn(
          styles.brandPanel,
          "relative isolate flex shrink-0 flex-col items-center justify-center overflow-hidden border-b border-sidebar-border bg-sidebar px-5 py-7 text-center text-sidebar-foreground lg:border-r lg:border-b-0 lg:px-10"
        )}
      >
        <p className="text-4xl leading-none font-extrabold tracking-[-0.075em] sm:text-5xl lg:text-[clamp(3.75rem,6.25vw,6.75rem)]">
          Shopi<span className="text-brand">Next</span>
        </p>
        <p className="mt-3 text-xs font-semibold tracking-[0.28em] text-sidebar-foreground/75 uppercase lg:mt-6 lg:text-sm">
          Admin
        </p>
      </div>
      <div className="flex min-w-0 flex-1 items-center justify-center px-5 py-10 sm:px-10">
        <LoginForm className="w-full max-w-sm" />
      </div>
    </main>
  )
}
