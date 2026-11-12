export type CustomerSession = {
  id: string
  description: string
  deviceType: "computer" | "mobile" | "tablet" | "unknown"
  isCurrent: boolean
  startedAt: string
  startedAtLabel: string
}

export type CustomerSessionsResult =
  | { status: "ready"; sessions: CustomerSession[] }
  | { status: "reauthenticate" }
  | { status: "error" }

export type SessionActionResult =
  | { status: "success"; signedOut: boolean }
  | { status: "reauthenticate" }
  | { status: "error"; message: string }
