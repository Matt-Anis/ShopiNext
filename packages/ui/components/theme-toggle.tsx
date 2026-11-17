"use client"

import { useSyncExternalStore } from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "./button"
import { cn } from "../lib/utils"

const subscribe = () => () => {}
const getSnapshot = () => true
const getServerSnapshot = () => false

export function ThemeToggle({ className }: { className?: string }) {
  const mounted = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const { resolvedTheme, setTheme } = useTheme()

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn("size-11", className)}
      aria-label="Dark theme"
      aria-pressed={mounted && resolvedTheme === "dark"}
      disabled={!mounted}
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <Moon aria-hidden="true" className="dark:hidden" />
      <Sun aria-hidden="true" className="hidden dark:block" />
    </Button>
  )
}
