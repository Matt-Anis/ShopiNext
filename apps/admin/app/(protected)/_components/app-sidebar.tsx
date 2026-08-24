"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight, Users } from "lucide-react"

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
import { NavUser } from "./nav-user"

export function AppSidebar({
  user,
}: {
  user: { name: string; email: string; image?: string | null }
}) {
  const pathname = usePathname()

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
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
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        render={<Link href="/staff/new" />}
                        isActive={pathname === "/staff/new"}
                      >
                        New staff
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
