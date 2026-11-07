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
  owner@example.com (role: owner)
  manager@example.com (role: manager)
  staff@example.com (role: staff)
  demo@example.com (role: demo)
  admin@example.com (role: owner)
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
