import "server-only"

import { userAgentFromString } from "next/server"
import type { CustomerSession } from "./session-types"

export function describeSessionDevice(userAgent: string | null | undefined) {
  const { browser, os, device } = userAgentFromString(userAgent ?? undefined)
  const platform = os.name ?? device.model
  const description =
    browser.name && platform
      ? `${browser.name} on ${platform}`
      : (browser.name ?? platform ?? "Unknown device")

  let deviceType: CustomerSession["deviceType"] = "unknown"
  if (device.type === "mobile" || device.type === "tablet") {
    deviceType = device.type
  } else if (!device.type && (os.name || browser.name)) {
    deviceType = "computer"
  }

  return { description, deviceType }
}

export function formatSessionStartedAt(startedAt: Date) {
  return `${new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(startedAt)} UTC`
}
