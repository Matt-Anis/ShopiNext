import { resetDatabase } from "./reset"
import { seedAdminUsers } from "./admin-users"
import { seedCategories } from "./categories"
import { seedProducts } from "./products"
import { seedCustomers } from "./customers"
import { seedOrders } from "./orders"

async function main() {
  console.log("Starting database seed...")

  await resetDatabase()
  const { adminId } = await seedAdminUsers()
  const categoryMap = await seedCategories()
  const variants = await seedProducts(categoryMap)
  const customers = await seedCustomers()
  await seedOrders({
    variants,
    customers,
    adminUserId: adminId,
  })

  console.log(`
Seed complete!
------------------------------------------------------------
Admin accounts:
  admin@example.com (role: admin)
  staff@example.com (role: staff)
  (Password: "secret")

Customer accounts:
  alice@example.com ... emma@example.com
  (Password: "secret password")

Catalog:
  ${categoryMap.size} categories
  50 products
  ${variants.length} total variants

Orders:
  9 orders total (7 active, 2 archived)
------------------------------------------------------------
`)
  process.exit(0)
}

main().catch((err) => {
  console.error("Seed failed:", err)
  process.exit(1)
})
