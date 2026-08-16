import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createAuthMiddleware, APIError } from "better-auth/api";
import { db } from "@/db";
import * as authSchema from "@/lib/auth-schema";
import { emailSignUpSchema } from "@/lib/validations/auth";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: authSchema,
  }),
  emailAndPassword: {
    enabled: true,
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
  },
});
