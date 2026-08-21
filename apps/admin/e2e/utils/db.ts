import { config } from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import * as adminAuthSchema from "@repo/db/admin/auth-schema";

config({ path: ".env.local" });

export const testDb = drizzle(process.env.DATABASE_URL_TEST!, {
  schema: { ...adminAuthSchema },
});
