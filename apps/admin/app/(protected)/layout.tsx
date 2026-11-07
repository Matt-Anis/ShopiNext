import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { auth } from "@/lib/auth"
import { roles } from "@/lib/auth/permissions"
import { AppSidebar } from "./_components/app-sidebar"
import { BreadcrumbProvider } from "./_components/breadcrumb-provider"
import { HeaderBreadcrumb } from "./_components/header-breadcrumb"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@repo/ui/sidebar"

export default async function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session) {
    redirect("/login")
  }

  if (!session.user.role || !(session.user.role in roles)) {
    redirect("/unauthorized")
  }

  return (
    <SidebarProvider>
      <AppSidebar user={session.user} />
      <SidebarInset>
        <BreadcrumbProvider>
          <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-4">
            <SidebarTrigger className="-ml-1" />
            <HeaderBreadcrumb />
          </header>
          {session.user.role === "demo" && (
            <div className="flex items-center justify-between border-b border-border bg-muted/50 px-4 py-2 text-xs text-muted-foreground">
              <span>
                Demo mode active: read-only access. Mutations are disabled and customer data is masked.
              </span>
            </div>
          )}
          {children}
        </BreadcrumbProvider>
      </SidebarInset>
    </SidebarProvider>
  )
}
