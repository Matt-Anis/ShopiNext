import { drizzle } from "drizzle-orm/node-postgres"
import { config } from "dotenv"
import * as schema from "@repo/db/public/schema"
import * as authSchema from "@repo/db/public/auth-schema"

config({ path: ".env.local" })

export const db = drizzle(process.env.DATABASE_URL!, {
  schema: { ...schema, ...authSchema },
})
