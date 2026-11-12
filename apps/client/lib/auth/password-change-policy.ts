import "server-only"

import type { GenericEndpointContext } from "better-auth"
import { APIError, isAPIError } from "better-auth/api"
import { deleteSessionCookie } from "better-auth/cookies"

export async function revokePasswordChangeSessions(
  ctx: GenericEndpointContext,
  returned: unknown
) {
  if (
    ctx.path !== "/change-password" ||
    isAPIError(returned) ||
    !returned ||
    typeof returned !== "object" ||
    !("user" in returned) ||
    !ctx.context.session
  ) {
    return
  }

  try {
    await ctx.context.internalAdapter.deleteUserSessions(
      ctx.context.session.user.id
    )
  } catch (error) {
    ctx.context.logger.error(
      "Unable to revoke sessions after password change",
      error
    )
    throw new APIError("INTERNAL_SERVER_ERROR", {
      message:
        "Your password changed, but we couldn't sign out every device. Sign in again to manage your sessions.",
    })
  } finally {
    deleteSessionCookie(ctx)
    ctx.context.setNewSession(null)
  }

  return ctx.json({ ...returned, token: null })
}
