"use client"

import { useSyncExternalStore } from "react"
import { GrainGradient } from "@paper-design/shaders-react"
import { useTheme } from "@repo/ui/theme-provider"

const LIGHT_PALETTE = {
  colorBack: "#f6f4ee",
  colors: ["#d0b34f", "#c49a38", "#e8dcb2"],
}

const DARK_PALETTE = {
  colorBack: "#181916",
  colors: ["#c49a2b", "#8b6d16", "#d0b34f"],
}

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)"

function subscribeNoop() {
  return () => {}
}

function subscribeReducedMotion(onStoreChange: () => void) {
  const mediaQuery = window.matchMedia(REDUCED_MOTION_QUERY)
  mediaQuery.addEventListener("change", onStoreChange)
  return () => mediaQuery.removeEventListener("change", onStoreChange)
}

function getReducedMotionSnapshot() {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches
}

export function LoginBackground() {
  const { resolvedTheme } = useTheme()
  const isMounted = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false
  )
  const prefersReducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    () => false
  )

  if (!isMounted) {
    return null
  }

  const palette = resolvedTheme === "dark" ? DARK_PALETTE : LIGHT_PALETTE

  return (
    <GrainGradient
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10"
      width="100%"
      height="100%"
      colors={palette.colors}
      colorBack={palette.colorBack}
      softness={0.7}
      intensity={0.15}
      noise={0}
      shape="wave"
      speed={prefersReducedMotion ? 0 : 1}
    />
  )
}
