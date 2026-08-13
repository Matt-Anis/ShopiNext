import { config } from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import * as authSchema from "@/lib/auth-schema";

config({ path: ".env.local" });

export const testDb = drizzle(process.env.DATABASE_URL_TEST!, {
  schema: authSchema,
});
