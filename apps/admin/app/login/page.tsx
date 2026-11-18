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
    <main
      className={cn(
        styles.glow,
        "relative isolate grid min-h-svh place-items-center overflow-hidden bg-background px-5 py-8 sm:px-10"
      )}
    >
      <LoginForm className="w-full max-w-sm" />
    </main>
  )
}
