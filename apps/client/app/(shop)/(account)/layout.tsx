import type { ReactNode } from "react"
import { AccountShell } from "@/features/account/components/account-shell"
import { requireCustomerSession } from "@/lib/require-customer-session"

export default async function AccountLayout({ children }: { children: ReactNode }) {
  await requireCustomerSession()

  return <AccountShell>{children}</AccountShell>
}
