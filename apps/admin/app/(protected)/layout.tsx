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
import { ShopiNextLogo } from "@repo/ui/shopinext-logo"
import { ThemeToggle } from "@repo/ui/theme-toggle"

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
      <SidebarProvider defaultOpen={false}>
        <AppSidebar user={session.user} />
        <SidebarInset className="min-w-0 [--admin-header-height:4rem] [--admin-header-offset:calc(var(--admin-header-height)_+_1.5rem)]">
          <BreadcrumbProvider>
            <header className="admin-frosted sticky top-0 z-20 grid h-(--admin-header-height) shrink-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-b border-border px-4 sm:gap-4 sm:px-6 md:grid-cols-[minmax(2.75rem,1fr)_minmax(0,45%)_minmax(2.75rem,1fr)] xl:grid-cols-[minmax(2.75rem,1fr)_minmax(0,28rem)_minmax(2.75rem,1fr)]">
              <div className="flex min-w-0 items-center gap-2">
                <SidebarTrigger
                  size="sm"
                  aria-label="Open ShopiNext navigation"
                  className="-ml-1 h-11 min-w-11 shrink-0 gap-2 px-1 sm:px-2 md:hidden"
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand text-sidebar-primary-foreground">
                    <ShopiNextLogo className="size-5" />
                  </span>
                  <span className="hidden font-semibold tracking-tight sm:inline">ShopiNext</span>
                </SidebarTrigger>
                <HeaderBreadcrumb />
              </div>
              <AdminGlobalSearch accountId={session.user.id} />
              <ThemeToggle className="hidden justify-self-end md:inline-flex" />
            </header>
            {session.user.role === "demo" && (
              <div className="border-b border-border bg-muted/50 px-4 py-2.5 text-xs leading-relaxed text-muted-foreground sm:px-6">
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
