import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import * as adminAuthSchema from "@repo/db/admin/auth-schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: adminAuthSchema,
  }),
  user: { modelName: "adminUser" },
  session: {
    modelName: "adminSession",
    cookieCache: {
      enabled: true,
      strategy: "jwe",
    },
  },
  account: { modelName: "adminAccount" },
  verification: { modelName: "adminVerification" },
  emailAndPassword: {
    enabled: true,
  },
});
