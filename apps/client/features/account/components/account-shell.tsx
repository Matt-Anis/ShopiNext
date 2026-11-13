import type { ReactNode } from "react"
import { AccountNavigation } from "./account-navigation"
import { LogoutButton } from "./logout-button"

export function AccountShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 md:grid-cols-[12rem_minmax(0,1fr)] md:gap-10 md:px-10 md:py-12">
      <aside className="space-y-4 md:sticky md:top-24 md:self-start">
        <p className="px-3 text-sm font-medium text-muted-foreground">
          Your account
        </p>
        <div className="flex items-center gap-2 md:block md:space-y-4">
          <AccountNavigation />
          <div className="ml-auto shrink-0 md:ml-0 md:border-t md:border-border md:pt-4">
            <LogoutButton />
          </div>
        </div>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  )
}
