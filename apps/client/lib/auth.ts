import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createAuthMiddleware, APIError } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/db";
import * as authSchema from "@repo/db/public/auth-schema";
import { emailSignUpSchema, profileNameSchema } from "@/lib/validations/auth";
import { sendVerificationEmail, sendPasswordResetEmail } from "@/lib/email";
import { sendAccountDeletionEmail } from "@/lib/email/account-deletion";
import { CART_COOKIE_NAME, parseCookie } from "@/features/cart/cookie";
import { mergeGuestCartIntoDb } from "@/features/cart/queries";
import { MIN_PASSWORD_LENGTH, MAX_PASSWORD_LENGTH } from "@/lib/password-rules";
import { enforcePasswordResetPolicy } from "@/lib/auth/password-reset-policy";
import { revokePasswordChangeSessions } from "@/lib/auth/password-change-policy";

export const auth = betterAuth({
  plugins: [nextCookies()],
  trustedOrigins: [process.env.BETTER_AUTH_URL as string],
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: authSchema,
  }),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: MIN_PASSWORD_LENGTH,
    maxPasswordLength: MAX_PASSWORD_LENGTH,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      await sendPasswordResetEmail(user.email, url);
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendVerificationEmail(user.email, url);
    },
  },
  user: {
    deleteUser: {
      enabled: true,
      deleteTokenExpiresIn: 60 * 60 * 24,
      sendDeleteAccountVerification: async ({ user, token }) => {
        const url = new URL("/delete-account", process.env.BETTER_AUTH_URL);
        url.searchParams.set("token", token);
        await sendAccountDeletionEmail(user.email, url.toString());
      },
    },
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      const resetResponse = await enforcePasswordResetPolicy(ctx);
      if (resetResponse) return resetResponse;

      if (ctx.path === "/sign-up/email") {
        const result = emailSignUpSchema.safeParse(ctx.body);
        if (!result.success) {
          throw new APIError("BAD_REQUEST", {
            message: result.error.issues[0]?.message ?? "Invalid input",
          });
        }
      }

      if (ctx.path === "/update-user" && ctx.body?.name !== undefined) {
        const result = profileNameSchema.safeParse(ctx.body);
        if (!result.success) {
          throw new APIError("BAD_REQUEST", {
            message: result.error.issues[0]?.message ?? "Invalid name",
          });
        }

        return {
          context: {
            ...ctx,
            body: { ...ctx.body, ...result.data },
          },
        };
      }
    }),
    after: createAuthMiddleware(async (ctx) => {
      const passwordResponse = await revokePasswordChangeSessions(
        ctx,
        ctx.context.returned,
      );
      if (passwordResponse) return passwordResponse;

      const newSession = ctx.context.newSession;
      if (!newSession?.user?.id) return;

      const rawCookie = ctx.getCookie(CART_COOKIE_NAME);
      if (!rawCookie) return;

      const guestItems = parseCookie(rawCookie);
      if (guestItems.length === 0) return;

      try {
        await mergeGuestCartIntoDb(newSession.user.id, guestItems);
        ctx.setCookie(CART_COOKIE_NAME, "", {
          maxAge: 0,
          path: "/",
        });
      } catch (error) {
        console.error("Failed to merge guest cart on login:", error);
      }
    }),
  },
});
