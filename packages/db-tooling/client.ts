import path from "node:path"
import { existsSync } from "node:fs"
import { drizzle } from "drizzle-orm/node-postgres"
import { config } from "dotenv"
import * as publicSchema from "@repo/db/public/schema"
import * as publicAuthSchema from "@repo/db/public/auth-schema"
import * as adminSchema from "@repo/db/admin/schema"
import * as adminAuthSchema from "@repo/db/admin/auth-schema"

const cwdEnv = path.resolve(process.cwd(), ".env.local")
const rootEnv = path.resolve(import.meta.dirname, "../../.env.local")
const envPath = existsSync(cwdEnv) ? cwdEnv : rootEnv

config({ path: envPath })

export const db = drizzle(process.env.DATABASE_URL!, {
  schema: {
    ...publicSchema,
    ...publicAuthSchema,
    ...adminSchema,
    ...adminAuthSchema,
  },
})
