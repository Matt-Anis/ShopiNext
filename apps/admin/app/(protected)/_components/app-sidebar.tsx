"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useRef } from "react"
import {
  ChevronRight,
  FolderTree,
  Image as ImageIcon,
  LayoutGrid,
  Package,
  ShoppingBag,
  UserCheck,
  Users,
  X,
  type LucideIcon,
} from "lucide-react"

import { Button } from "@repo/ui/button"
import { ShopiNextLogo } from "@repo/ui/shopinext-logo"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@repo/ui/collapsible"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@repo/ui/sidebar"
import { usePermission } from "@/hooks/use-permission"
import { useSidebarProximityGlow } from "@/hooks/use-sidebar-proximity-glow"
import { NavUser } from "./nav-user"

type NavigationSection = {
  href: string
  label: string
  icon: LucideIcon
  links?: { href: string; label: string }[]
}

export function AppSidebar({
  user,
}: {
  user: { name: string; email: string; image?: string | null }
}) {
  const pathname = usePathname()
  const { isMobile, setOpen, setOpenMobile, setPreviewOpen, state } = useSidebar()
  const panelRef = useRef<HTMLDivElement>(null)
  useSidebarProximityGlow(panelRef, !isMobile && state === "collapsed")
  const canViewOverview = usePermission("analytics", "read")
  const canViewStaff = usePermission("user", "list")
  const canCreateStaff = usePermission("user", "create")
  const canCreateProduct = usePermission("products", "create")

  const sections: NavigationSection[] = [
    ...(canViewOverview ? [{ href: "/", label: "Overview", icon: LayoutGrid }] : []),
    {
      href: "/orders",
      label: "Orders",
      icon: ShoppingBag,
      links: [
        { href: "/orders", label: "All orders" },
        { href: "/orders/archived", label: "Archived" },
      ],
    },
    {
      href: "/products",
      label: "Products",
      icon: Package,
      links: [
        { href: "/products", label: "All products" },
        ...(canCreateProduct ? [{ href: "/products/new", label: "New product" }] : []),
      ],
    },
    { href: "/categories", label: "Categories", icon: FolderTree },
    { href: "/media", label: "Media", icon: ImageIcon },
    { href: "/customers", label: "Customers", icon: UserCheck },
  ]

  if (canViewStaff) {
    sections.push({
      href: "/staff",
      label: "Staff",
      icon: Users,
      links: [
        { href: "/staff", label: "All staff" },
        ...(canCreateStaff ? [{ href: "/staff/new", label: "New staff" }] : []),
      ],
    })
  }

  function closeMobileNavigation() {
    if (isMobile) setOpenMobile(false)
  }

  function closeNavigation() {
    if (isMobile) {
      closeMobileNavigation()
      return
    }
    setPreviewOpen(false)
    setOpen(false)
    document.getElementById("admin-sidebar-trigger")?.focus()
  }

  return (
    <Sidebar
      collapsible="icon"
      expandOnHover
      ref={panelRef}
      className="admin-sidebar-panel border-sidebar-border"
      onKeyDown={(event) => {
        if (!isMobile && event.key === "Escape" && !event.defaultPrevented && event.currentTarget.contains(event.target as Node)) {
          event.preventDefault()
          closeNavigation()
        }
      }}
    >
      <SidebarHeader className="h-16 shrink-0 flex-row items-center justify-between border-b border-sidebar-border px-4 group-data-[collapsible=icon]:px-2">
        <div className="flex items-center gap-2.5">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <ShopiNextLogo className="size-5" />
          </span>
          <span className="font-semibold tracking-tight whitespace-nowrap group-data-[collapsible=icon]:sr-only">ShopiNext</span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-11 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:hidden"
          aria-label="Close navigation"
          onClick={closeNavigation}
        >
          <X aria-hidden="true" />
        </Button>
      </SidebarHeader>
      <SidebarContent className="group-data-[collapsible=icon]:overflow-y-auto">
        <nav aria-label="Admin navigation">
          <SidebarGroup className="p-3 group-data-[collapsible=icon]:px-2">
            <SidebarMenu className="gap-1">
              {sections.map(({ href, label, icon: Icon, links }) => {
                const isCurrent = pathname === href
                const isActive = isCurrent || pathname.startsWith(`${href}/`)
                const buttonClassName = "max-md:h-11 data-active:[&>svg:first-child]:text-sidebar-primary"

                if (!links) {
                  return (
                    <SidebarMenuItem key={href}>
                      <SidebarMenuButton
                        render={
                          <Link href={href} onNavigate={closeMobileNavigation} aria-current={isCurrent ? "page" : undefined} />
                        }
                        isActive={isActive}
                        className={buttonClassName}
                      >
                        <Icon aria-hidden="true" />
                        <span className="group-data-[collapsible=icon]:sr-only">{label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                }

                return (
                  <SidebarMenuItem key={href}>
                    <Collapsible defaultOpen>
                      <CollapsibleTrigger
                        render={<SidebarMenuButton isActive={isActive} className={`group/collapsible ${buttonClassName}`} />}
                      >
                        <Icon aria-hidden="true" />
                        <span className="group-data-[collapsible=icon]:sr-only">{label}</span>
                        <ChevronRight aria-hidden="true" className="ml-auto transition-transform group-data-[panel-open]/collapsible:rotate-90 group-data-[collapsible=icon]:hidden" />
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {links.map((link) => (
                            <SidebarMenuSubItem key={link.href} className="[&>span]:bg-sidebar-primary">
                              <SidebarMenuSubButton
                                render={
                                  <Link
                                    href={link.href}
                                    onNavigate={closeMobileNavigation}
                                    aria-current={pathname === link.href ? "page" : undefined}
                                  />
                                }
                                isActive={pathname === link.href}
                                className="max-md:h-11"
                              >
                                {link.label}
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </Collapsible>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroup>
        </nav>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
