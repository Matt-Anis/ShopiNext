import type { ReactNode } from "react"
import { AccountNavigation } from "./account-navigation"
import { LogoutButton } from "./logout-button"

export function AccountShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 md:py-16">
      <AccountNavigation />
      <div className="mb-8 border-t border-border pt-4">
        <LogoutButton />
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  )
}
