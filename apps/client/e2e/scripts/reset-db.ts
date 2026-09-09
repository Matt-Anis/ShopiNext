import {
  resetAuthTables,
  resetCartTables,
  resetOrderTables,
} from "../utils/db-reset";

async function main() {
  await resetOrderTables();
  await resetCartTables();
  await resetAuthTables();
  console.log("Local test DB wiped.");
}

main();
