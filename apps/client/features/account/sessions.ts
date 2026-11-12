import "server-only"

import { headers } from "next/headers"
import { isAPIError } from "better-auth/api"
import { auth } from "@/lib/auth"
import {
  describeSessionDevice,
  formatSessionStartedAt,
} from "./session-presentation"
import type { CustomerSessionsResult } from "./session-types"

export async function listCustomerSessionRecords() {
  return auth.api.listSessions({ headers: await headers() })
}

export async function getCustomerSessions(
  currentSessionId: string
): Promise<CustomerSessionsResult> {
  try {
    const sessions = await listCustomerSessionRecords()
    if (sessions.length === 0) return { status: "reauthenticate" }

    return {
      status: "ready",
      sessions: sessions
        .map((session) => ({
          id: session.id,
          ...describeSessionDevice(session.userAgent),
          isCurrent: session.id === currentSessionId,
          startedAt: session.createdAt.toISOString(),
          startedAtLabel: formatSessionStartedAt(session.createdAt),
        }))
        .sort(
          (a, b) =>
            Number(b.isCurrent) - Number(a.isCurrent) ||
            b.startedAt.localeCompare(a.startedAt)
        ),
    }
  } catch (error) {
    if (
      isAPIError(error) &&
      (error.body?.code === "SESSION_NOT_FRESH" || error.statusCode === 401)
    ) {
      return { status: "reauthenticate" }
    }

    console.error("Unable to load customer sessions", error)
    return { status: "error" }
  }
}
