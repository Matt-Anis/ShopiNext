import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { auth } from "@/lib/auth"
import { roles, type RoleName } from "@/lib/auth/permissions"
import { AppSidebar } from "./_components/app-sidebar"
import { BreadcrumbProvider } from "./_components/breadcrumb-provider"
import { HeaderBreadcrumb } from "./_components/header-breadcrumb"
import { AdminGlobalSearch } from "./_components/global-search"
import { RoleProvider } from "./_components/role-provider"
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
    <RoleProvider role={session.user.role as RoleName}>
      <SidebarProvider>
        <AppSidebar user={session.user} />
        <SidebarInset>
          <BreadcrumbProvider>
            <header className="grid h-14 shrink-0 grid-cols-[minmax(2rem,1fr)_minmax(0,28rem)_minmax(2rem,1fr)] items-center gap-2 border-b border-border px-4">
              <div className="flex min-w-0 items-center gap-2 overflow-hidden">
                <SidebarTrigger className="-ml-1 shrink-0" />
                <div className="hidden min-w-0 overflow-hidden lg:block">
                  <HeaderBreadcrumb />
                </div>
              </div>
              <AdminGlobalSearch accountId={session.user.id} />
              <div aria-hidden="true" />
            </header>
            {session.user.role === "demo" && (
              <div className="flex items-center justify-between border-b border-border bg-muted/50 px-4 py-2 text-xs text-muted-foreground">
                <span>
                  Demo mode active: read-only access. Mutations are disabled and
                  customer data is masked.
                </span>
              </div>
            )}
            {children}
          </BreadcrumbProvider>
        </SidebarInset>
      </SidebarProvider>
    </RoleProvider>
  )
}
