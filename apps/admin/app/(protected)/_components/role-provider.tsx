"use client"

import { createContext, useContext } from "react"
import type { RoleName } from "@/lib/auth/permissions"

const RoleContext = createContext<RoleName | null>(null)

export function RoleProvider({
  role,
  children,
}: {
  role: RoleName
  children: React.ReactNode
}) {
  return <RoleContext.Provider value={role}>{children}</RoleContext.Provider>
}

export function useCurrentRole(): RoleName | null {
  return useContext(RoleContext)
}
