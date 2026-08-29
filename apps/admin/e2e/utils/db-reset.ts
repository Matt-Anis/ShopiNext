import { testDb } from "./db";
import {
  adminSession,
  adminAccount,
  adminUser,
  adminVerification,
} from "@repo/db/admin/auth-schema";
import { categories, productCategories } from "@repo/db/public/schema";

export async function resetAuthTables() {
  await testDb.delete(adminSession);
  await testDb.delete(adminAccount);
  await testDb.delete(adminUser);
  await testDb.delete(adminVerification);
}

export async function resetCategoryTables() {
  await testDb.delete(productCategories);
  await testDb.delete(categories);
}
