import { config } from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import * as authSchema from "@repo/db/public/auth-schema";
import * as appSchema from "@repo/db/public/schema";

config({ path: ".env.local" });

export const testDb = drizzle(process.env.DATABASE_URL_TEST!, {
  schema: { ...authSchema, ...appSchema },
});
