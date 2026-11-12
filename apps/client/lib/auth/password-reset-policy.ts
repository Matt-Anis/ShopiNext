import "server-only"

import type { Account, GenericEndpointContext } from "better-auth"
import { APIError } from "better-auth/api"

function hasPasswordAccount(accounts: Account[]) {
  return accounts.some(
    (account) => account.providerId === "credential" && !!account.password
  )
}

export async function enforcePasswordResetPolicy(ctx: GenericEndpointContext) {
  if (ctx.path === "/request-password-reset") {
    if (typeof ctx.body?.email !== "string") return

    const customer = await ctx.context.internalAdapter.findUserByEmail(
      ctx.body.email,
      { includeAccounts: true }
    )

    if (customer && !hasPasswordAccount(customer.accounts)) {
      return ctx.json({
        status: true,
        message:
          "If this email exists in our system, check your email for the reset link",
      })
    }
  }

  if (ctx.path === "/reset-password") {
    const token = ctx.body?.token || ctx.query?.token
    if (typeof token !== "string" || !token) return

    const verification = await ctx.context.internalAdapter.findVerificationValue(
      `reset-password:${token}`
    )

    if (!verification || verification.expiresAt <= new Date()) {
      throw new APIError("BAD_REQUEST", {
        message: "Invalid or expired reset link",
      })
    }

    const accounts = await ctx.context.internalAdapter.findAccounts(
      verification.value
    )

    if (!hasPasswordAccount(accounts)) {
      throw new APIError("BAD_REQUEST", {
        message: "Invalid or expired reset link",
      })
    }
  }
}
