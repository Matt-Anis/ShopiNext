"use server"

import { headers } from "next/headers"
import { revalidatePath } from "next/cache"
import { isAPIError } from "better-auth/api"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { listCustomerSessionRecords } from "./sessions"
import type { SessionActionResult } from "./session-types"

const sessionIdSchema = z.string().min(1).max(256)

function sessionActionFailure(
  error: unknown,
  message: string
): SessionActionResult {
  if (
    isAPIError(error) &&
    (error.body?.code === "SESSION_NOT_FRESH" || error.statusCode === 401)
  ) {
    return { status: "reauthenticate" }
  }

  console.error("Unable to revoke customer sessions", error)
  return {
    status: "error",
    message,
  }
}

export async function revokeCustomerSession(
  sessionId: unknown
): Promise<SessionActionResult> {
  const parsedId = sessionIdSchema.safeParse(sessionId)
  if (!parsedId.success) {
    return {
      status: "error",
      message: "Please select a valid signed-in device.",
    }
  }

  try {
    const requestHeaders = await headers()
    const current = await auth.api.getSession({
      headers: requestHeaders,
      query: { disableCookieCache: true },
    })
    if (!current) return { status: "reauthenticate" }

    const sessions = await listCustomerSessionRecords()
    const target = sessions.find(
      (session) =>
        session.id === parsedId.data && session.userId === current.user.id
    )
    if (!target) {
      return {
        status: "error",
        message:
          "This sign-in has already ended. Refresh the page to update your devices.",
      }
    }

    await auth.api.revokeSession({
      headers: requestHeaders,
      body: { token: target.token },
    })

    const signedOut = target.id === current.session.id
    if (signedOut) {
      await auth.api.signOut({ headers: requestHeaders })
    } else {
      revalidatePath("/profile/settings")
    }

    return { status: "success", signedOut }
  } catch (error) {
    return sessionActionFailure(
      error,
      "We couldn't sign out the selected device. Please try again."
    )
  }
}

export async function revokeAllCustomerSessions(): Promise<SessionActionResult> {
  try {
    const requestHeaders = await headers()
    await auth.api.revokeSessions({ headers: requestHeaders })
    await auth.api.signOut({ headers: requestHeaders })

    return { status: "success", signedOut: true }
  } catch (error) {
    return sessionActionFailure(
      error,
      "We couldn't sign out all devices. Please try again."
    )
  }
}
