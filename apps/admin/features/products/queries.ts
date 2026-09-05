import { eq } from "drizzle-orm"

import { db } from "@/db"
import { products } from "@repo/db/public/schema"

export async function getProductForWizard(id: string) {
  return db.query.products.findFirst({
    where: eq(products.id, id),
  })
}
