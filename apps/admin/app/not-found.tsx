import { headers } from "next/headers"
import Link from "next/link"
import { redirect } from "next/navigation"
import { buttonVariants } from "@repo/ui/button"

import { auth } from "@/lib/auth"
import { roles } from "@/lib/auth/permissions"

export default async function NotFound() {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session) {
    redirect("/login")
  }

  if (!session.user.role || !(session.user.role in roles)) {
    redirect("/unauthorized")
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <span className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
        Lost in Inventory
      </span>
      <h1 className="mt-2 text-8xl font-extrabold tracking-tighter text-foreground sm:text-9xl">
        404
      </h1>
      <p className="mt-4 max-w-sm text-base text-muted-foreground">
        Even our best barcode scanner could not find this page. It might have
        been discontinued, misplaced, or eaten by warehouse gremlins.
      </p>
      <div className="mt-6">
        <Link
          href="/"
          className={buttonVariants({ variant: "outline", size: "default" })}
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  )
}
