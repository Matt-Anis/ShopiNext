import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { auth } from "@/lib/auth"
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

  return (
    <SidebarProvider>
      <AppSidebar user={session.user} />
      <SidebarInset>
        <BreadcrumbProvider>
          <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-4">
            <SidebarTrigger className="-ml-1" />
            <HeaderBreadcrumb />
          </header>
          {children}
        </BreadcrumbProvider>
      </SidebarInset>
    </SidebarProvider>
  )
}
