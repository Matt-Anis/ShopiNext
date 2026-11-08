import type { Metadata } from "next"
import Link from "next/link"
import { buttonVariants } from "@repo/ui/button"

export const metadata: Metadata = {
  title: "Access Denied | ShopiNext Admin",
  description: "You do not have permission to view this page.",
}

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-6 md:p-12">
      <div className="grid w-full max-w-6xl grid-cols-1 items-center gap-8 md:grid-cols-2 md:gap-16">
        <div>
          <span className="inline-block text-xs font-semibold tracking-widest text-muted-foreground uppercase">
            403 Error
          </span>
          <h1 className="acking-tighter mt-2 text-6xl leading-[0.9] font-semibold text-foreground sm:text-7xl md:text-8xl lg:text-9xl">
            Access
            <br />
            Denied
          </h1>
        </div>

        <div className="flex flex-col items-start gap-6 md:max-w-md">
          <p className="text-lg leading-relaxed text-muted-foreground sm:text-xl">
            You do not have the required permissions to view this section of the
            admin dashboard.
          </p>
          <p className="text-sm text-muted-foreground/80">
            If you believe this is a mistake, please reach out to the store
            owner to adjust your account role.
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className={buttonVariants({ variant: "default", size: "lg" })}
            >
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
