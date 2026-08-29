import { config } from "dotenv"
config({ path: ".env.local" })

import { db } from "./index"
import { categories } from "@repo/db/public/schema"
import { seed } from "drizzle-seed"

const CATEGORY_NAMES = [
  "Electronics",
  "Kitchen",
  "Outdoor",
  "Fitness",
  "Books",
  "Toys",
  "Beauty",
  "Automotive",
  "Garden",
  "Furniture",
]

async function main() {
  await db.delete(categories)

  await seed(db, { categories }).refine((f) => ({
    categories: {
      count: CATEGORY_NAMES.length,
      columns: {
        name: f.valuesFromArray({ values: CATEGORY_NAMES, isUnique: true }),
        description: f.loremIpsum({ sentencesCount: 3 }),
      },
    },
  }))

  console.log(`Seeded ${CATEGORY_NAMES.length} categories.`)
  process.exit(0)
}

main().catch((err) => {
  console.error("Seed failed:", err)
  process.exit(1)
})
