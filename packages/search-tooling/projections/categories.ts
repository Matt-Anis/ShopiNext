import type { categories } from "@repo/db/public/schema";
import type { CategoryDocument } from "@repo/search/server/documents";
import { descriptionToText } from "./description";

type CategoryProjectionSource = Pick<
  typeof categories.$inferSelect,
  "id" | "name" | "slug" | "description" | "isActive"
>;

export function projectCategory(
  category: CategoryProjectionSource,
): CategoryDocument | null {
  if (!category.isActive) return null;

  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: descriptionToText(category.description),
  };
}
