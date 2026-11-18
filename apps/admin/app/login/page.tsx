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
    <main className={cn(styles.stage, "relative isolate flex min-h-svh flex-col overflow-hidden bg-sidebar")}>
      <div className="flex shrink-0 justify-center border-b border-sidebar-border px-4 py-8 text-center text-sidebar-foreground sm:py-10 lg:border-0 lg:px-8 lg:pt-[clamp(2rem,7svh,6rem)] lg:pb-0">
        <p className={cn(styles.wordmark, "leading-[0.88] font-extrabold tracking-[-0.075em] whitespace-nowrap")}>
          Shopi<span className="text-brand">Next</span>
        </p>
      </div>
      <div className="flex min-w-0 flex-1 items-start justify-center bg-background px-5 py-8 sm:px-10 sm:py-10 lg:items-center lg:bg-transparent lg:py-8">
        <LoginForm className="w-full max-w-sm lg:max-w-md lg:rounded-2xl lg:border lg:border-border lg:bg-card lg:p-8 lg:shadow-2xl" />
      </div>
    </main>
  )
}
