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
    <main className="flex min-h-svh flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="flex min-w-0 shrink-0 items-center justify-center overflow-hidden border-b border-sidebar-border bg-sidebar px-4 py-8 text-sidebar-foreground sm:py-10 lg:border-r lg:border-b-0 lg:px-[clamp(1.25rem,2.2vw,3rem)]">
        <p className={cn(styles.wordmark, "leading-none font-extrabold tracking-[-0.075em] whitespace-nowrap lg:leading-[0.84]")}>
          <span className="lg:block">Shopi</span>
          <span className="text-brand lg:block">Next</span>
        </p>
      </div>
      <div
        className={cn(
          styles.formPanel,
          "relative isolate flex min-w-0 flex-1 items-start justify-center overflow-hidden bg-background px-5 py-8 sm:px-10 sm:py-10 lg:items-center"
        )}
      >
        <LoginForm className="w-full max-w-sm" />
      </div>
    </main>
  )
}
