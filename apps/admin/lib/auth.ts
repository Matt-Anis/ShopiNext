import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import * as adminAuthSchema from "@repo/db/admin/auth-schema";

// Overridable in tests so the cache-staleness path can be exercised without
// waiting out the real (5 minute default) window.
const cookieCacheMaxAge = process.env.SESSION_COOKIE_CACHE_MAX_AGE
  ? Number(process.env.SESSION_COOKIE_CACHE_MAX_AGE)
  : undefined;

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
      ...(cookieCacheMaxAge ? { maxAge: cookieCacheMaxAge } : {}),
    },
  },
  account: { modelName: "adminAccount" },
  verification: { modelName: "adminVerification" },
  emailAndPassword: {
    enabled: true,
  },
});
