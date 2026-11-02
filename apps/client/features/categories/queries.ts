import { asc, eq } from "drizzle-orm"
import { db } from "@/db"
import { categories } from "@repo/db/public/schema"

export type Category = {
  id: string
  name: string
  slug: string
  description: string | null
}

export const getActiveCategories = async (): Promise<Category[]> => {
  return db.query.categories.findMany({
    where: eq(categories.isActive, true),
    orderBy: [asc(categories.name)],
    columns: {
      id: true,
      name: true,
      slug: true,
      description: true,
    },
  })
}
