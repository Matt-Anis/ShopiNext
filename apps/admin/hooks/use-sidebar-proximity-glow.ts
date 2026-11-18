"use client"

import { useEffect, type RefObject } from "react"

const GLOW_DISTANCE = 28

export function useSidebarProximityGlow(
  panelRef: RefObject<HTMLDivElement | null>,
  enabled: boolean
) {
  useEffect(() => {
    const panel = panelRef.current
    const rail = panel?.parentElement?.querySelector('[data-slot="sidebar-gap"]')
    if (!enabled || !panel || !rail) return

    const hover = window.matchMedia("(hover: hover) and (pointer: fine)")

    const clearGlow = () => {
      panel.style.removeProperty("--sidebar-glow-opacity")
      panel.style.removeProperty("--sidebar-glow-y")
    }

    const updateGlow = (event: PointerEvent) => {
      if (!hover.matches || event.pointerType !== "mouse") {
        clearGlow()
        return
      }

      const distance = event.clientX - rail.getBoundingClientRect().right
      if (distance < 0 || distance >= GLOW_DISTANCE) {
        clearGlow()
        return
      }

      panel.style.setProperty("--sidebar-glow-opacity", String(1 - distance / GLOW_DISTANCE))
      panel.style.setProperty("--sidebar-glow-y", `${event.clientY}px`)
    }

    function handlePointerOut(event: PointerEvent) {
      if (!event.relatedTarget) clearGlow()
    }

    window.addEventListener("pointermove", updateGlow, { passive: true })
    window.addEventListener("pointerout", handlePointerOut)
    window.addEventListener("blur", clearGlow)
    return () => {
      window.removeEventListener("pointermove", updateGlow)
      window.removeEventListener("pointerout", handlePointerOut)
      window.removeEventListener("blur", clearGlow)
      clearGlow()
    }
  }, [enabled, panelRef])
}
