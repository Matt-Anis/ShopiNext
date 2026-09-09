import {
  resetAuthTables,
  resetCategoryTables,
  resetProductTables,
} from "../utils/db-reset"

async function main() {
  await resetProductTables()
  await resetCategoryTables()
  await resetAuthTables()
  console.log("Local test DB wiped.")
}

main()
