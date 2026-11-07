"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  ChevronRight,
  FolderTree,
  Image as ImageIcon,
  Package,
  ShoppingBag,
  UserCheck,
  Users,
} from "lucide-react"

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@repo/ui/collapsible"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@repo/ui/sidebar"
import { usePermission } from "@/hooks/use-permission"
import { NavUser } from "./nav-user"

export function AppSidebar({
  user,
}: {
  user: { name: string; email: string; image?: string | null }
}) {
  const pathname = usePathname()
  const canViewStaff = usePermission("user", "list")
  const canCreateStaff = usePermission("user", "create")
  const canCreateProduct = usePermission("products", "create")

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {canViewStaff && (
              <Collapsible defaultOpen>
                <SidebarMenuItem>
                  <CollapsibleTrigger
                    render={<SidebarMenuButton className="group/collapsible" />}
                  >
                    <Users />
                    Staff
                    <ChevronRight className="ml-auto transition-transform group-data-[panel-open]/collapsible:rotate-90" />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton
                          render={<Link href="/staff" />}
                          isActive={pathname === "/staff"}
                        >
                          All staff
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      {canCreateStaff && (
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton
                            render={<Link href="/staff/new" />}
                            isActive={pathname === "/staff/new"}
                          >
                            New staff
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      )}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            )}
            <Collapsible defaultOpen>
              <SidebarMenuItem>
                <CollapsibleTrigger
                  render={<SidebarMenuButton className="group/collapsible" />}
                >
                  <ShoppingBag />
                  Orders
                  <ChevronRight className="ml-auto transition-transform group-data-[panel-open]/collapsible:rotate-90" />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        render={<Link href="/orders" />}
                        isActive={pathname === "/orders"}
                      >
                        All orders
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        render={<Link href="/orders/archived" />}
                        isActive={pathname === "/orders/archived"}
                      >
                        Archived
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
            <SidebarMenuItem>
              <SidebarMenuButton
                render={<Link href="/customers" />}
                isActive={pathname.startsWith("/customers")}
              >
                <UserCheck />
                Customers
              </SidebarMenuButton>
            </SidebarMenuItem>
            <Collapsible defaultOpen>
              <SidebarMenuItem>
                <CollapsibleTrigger
                  render={<SidebarMenuButton className="group/collapsible" />}
                >
                  <Package />
                  Products
                  <ChevronRight className="ml-auto transition-transform group-data-[panel-open]/collapsible:rotate-90" />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        render={<Link href="/products" />}
                        isActive={pathname === "/products"}
                      >
                        All products
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    {canCreateProduct && (
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton
                          render={<Link href="/products/new" />}
                          isActive={pathname === "/products/new"}
                        >
                          New product
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    )}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
            <SidebarMenuItem>
              <SidebarMenuButton
                render={<Link href="/categories" />}
                isActive={pathname === "/categories"}
              >
                <FolderTree />
                Categories
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                render={<Link href="/media" />}
                isActive={pathname === "/media"}
              >
                <ImageIcon />
                Media
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
