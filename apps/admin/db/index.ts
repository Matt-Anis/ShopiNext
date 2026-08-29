import { drizzle } from "drizzle-orm/node-postgres";
import * as publicSchema from "@repo/db/public/schema";
import * as adminSchema from "@repo/db/admin/schema";
import * as adminAuthSchema from "@repo/db/admin/auth-schema";
import { config } from "dotenv";

config({ path: ".env.local" });

export const db = drizzle(process.env.DATABASE_URL!, {
  schema: { ...publicSchema, ...adminSchema, ...adminAuthSchema },
});
