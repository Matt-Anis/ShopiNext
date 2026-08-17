import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@repo/db/public/schema";
import { config } from "dotenv";

config({ path: ".env.local" });

export const db = drizzle(process.env.DATABASE_URL!, { schema });
