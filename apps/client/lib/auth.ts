import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createAuthMiddleware, APIError } from "better-auth/api";
import { db } from "@/db";
import * as authSchema from "@repo/db/public/auth-schema";
import { emailSignUpSchema } from "@/lib/validations/auth";
import { sendVerificationEmail, sendPasswordResetEmail } from "@/lib/email";
import { CART_COOKIE_NAME, parseCookie } from "@/features/cart/cookie";
import { mergeGuestCartIntoDb } from "@/features/cart/queries";

export const auth = betterAuth({
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
    minPasswordLength: 8,
    maxPasswordLength: 20,
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
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path === "/sign-up/email") {
        const result = emailSignUpSchema.safeParse(ctx.body);
        if (!result.success) {
          throw new APIError("BAD_REQUEST", {
            message: result.error.issues[0]?.message ?? "Invalid input",
          });
        }
      }
    }),
    after: createAuthMiddleware(async (ctx) => {
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
