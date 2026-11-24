import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { Card, CardContent } from "@repo/ui/card"

import { auth } from "@/lib/auth"
import { LoginBackground } from "./_components/login-background"
import { LoginForm } from "./_components/login-form"

export default async function LoginPage() {
  const session = await auth.api.getSession({ headers: await headers() })

  if (session) {
    redirect("/")
  }

  return (
    <main className="relative isolate grid min-h-svh place-items-center overflow-hidden bg-background px-5 py-8 sm:px-10">
      <LoginBackground />
      <Card className="w-full max-w-md bg-card/75 backdrop-blur-2xl backdrop-saturate-150 sm:py-8">
        <CardContent className="sm:px-8">
          <LoginForm />
        </CardContent>
      </Card>
    </main>
  )
}
