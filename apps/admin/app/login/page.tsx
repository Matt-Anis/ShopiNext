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
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex items-center justify-center gap-2.5 font-semibold tracking-tight">
          <ShopiNextLogo className="size-8 text-primary" />
          <span>ShopiNext Admin</span>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
