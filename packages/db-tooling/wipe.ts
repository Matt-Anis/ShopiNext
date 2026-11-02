import path from "node:path"
import { existsSync } from "node:fs"
import readline from "node:readline"
import { Client } from "pg"
import { config } from "dotenv"

function loadEnv() {
  const cwdEnv = path.resolve(process.cwd(), ".env.local")
  const rootEnv = path.resolve(import.meta.dirname, "../../.env.local")
  const envPath = existsSync(cwdEnv) ? cwdEnv : rootEnv
  config({ path: envPath })
}

function promptUser(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close()
      resolve(answer.trim())
    })
  })
}

export type WipeOptions = {
  connectionString?: string
  force?: boolean
}

export async function wipeDatabase(options: WipeOptions = {}) {
  loadEnv()

  const connectionString =
    options.connectionString ||
    process.env.DATABASE_URL ||
    process.env.DATABASE_URL_TEST

  if (!connectionString) {
    throw new Error(
      "No database connection string provided. Set DATABASE_URL or pass connectionString."
    )
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Safety check failed: Refusing to wipe database when NODE_ENV is 'production'."
    )
  }

  let host = "unknown"
  let database = "unknown"
  try {
    const parsed = new URL(connectionString)
    host = parsed.hostname
    database = parsed.pathname.replace(/^\//, "")
  } catch {
    // If connectionString is not a standard URL, skip parsing
  }

  const isLocal =
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "::1" ||
    host === "docker"

  const isConfirmed =
    options.force ||
    process.env.CONFIRM_WIPE === "true" ||
    process.env.CONFIRM_WIPE === "yes"

  if (!isLocal && !isConfirmed) {
    if (process.stdin.isTTY) {
      console.warn(`\n[WARNING] Remote database detected: ${host}/${database}`)
      const answer = await promptUser(
        "Are you sure you want to wipe ALL data in this database? Type 'yes' to proceed: "
      )
      if (answer.toLowerCase() !== "yes") {
        console.log("Operation aborted by user.")
        return
      }
    } else {
      throw new Error(
        `Safety check failed: Refusing to wipe remote database (${host}/${database}) in non-interactive environment without CONFIRM_WIPE=true.`
      )
    }
  }

  const client = new Client({ connectionString })
  await client.connect()

  try {
    const res = await client.query<{
      table_schema: string
      table_name: string
    }>(`
      SELECT table_schema, table_name
      FROM information_schema.tables
      WHERE table_schema IN ('public', 'admin')
        AND table_type = 'BASE TABLE'
        AND table_name != '__drizzle_migrations'
      ORDER BY table_schema, table_name;
    `)

    if (res.rows.length === 0) {
      console.log(`[wipe] No user tables found in database (${database}).`)
      return
    }

    const tableNames = res.rows.map(
      (r) =>
        `"${r.table_schema.replace(/"/g, '""')}"."${r.table_name.replace(/"/g, '""')}"`
    )

    console.log(
      `[wipe] Truncating ${tableNames.length} tables in ${database}@${host}...`
    )

    await client.query(
      `TRUNCATE TABLE ${tableNames.join(", ")} RESTART IDENTITY CASCADE;`
    )

    console.log(`[wipe] Successfully wiped all data from ${tableNames.length} tables:`)
    for (const r of res.rows) {
      console.log(`  • ${r.table_schema}.${r.table_name}`)
    }
  } finally {
    await client.end()
  }
}

// When invoked directly via CLI (tsx wipe.ts)
const isDirectCall =
  process.argv[1] &&
  (process.argv[1].endsWith("/wipe.ts") || process.argv[1].endsWith("/wipe.js"))

if (isDirectCall) {
  wipeDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("[wipe] Error:", err.message || err)
      process.exit(1)
    })
}
