import { categories } from "@repo/db/public/schema";
import { testDb } from "./db";

export const DEFAULT_TEST_CATEGORY = {
  name: "Test Category",
  description: "A category used in e2e tests",
};

export async function seedCategory(
  overrides: Partial<typeof DEFAULT_TEST_CATEGORY> = {},
) {
  const [category] = await testDb
    .insert(categories)
    .values({ ...DEFAULT_TEST_CATEGORY, ...overrides })
    .returning();

  if (!category) {
    throw new Error("Failed to seed category");
  }

  return category;
}
