import { db } from "@/db"
import { CategoriesClient } from "./_components/categories-client"

export default async function CategoriesPage() {
  const categories = await db.query.categories.findMany({
    orderBy: (categories, { asc }) => [asc(categories.name)],
    with: { updatedByAdmin: true },
  })

  return (
    <div className="flex flex-col gap-4 p-4">
      <CategoriesClient categories={categories} />
    </div>
  )
}
