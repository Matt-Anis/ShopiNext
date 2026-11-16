import type { products } from "@repo/db/public/schema";
import type { PublicProductDocument } from "@repo/search/server/documents";
import { descriptionToText } from "./description";

export type ProductProjectionSource = Pick<
  typeof products.$inferSelect,
  "id" | "name" | "slug" | "description" | "isActive" | "status" | "minPrice"
> & {
  images: { url: string }[];
  productCategories: { category: { name: string; isActive: boolean } }[];
};

export function projectProductFields(
  product: ProductProjectionSource,
  categoryNames: string[],
): PublicProductDocument {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: descriptionToText(product.description),
    thumbnailUrl: product.images[0]?.url ?? null,
    categoryNames: [...new Set(categoryNames)].sort((a, b) =>
      a.localeCompare(b, "en"),
    ),
  };
}

export function projectPublicProduct(
  product: ProductProjectionSource,
): PublicProductDocument | null {
  if (
    !product.isActive ||
    product.status !== "active" ||
    product.minPrice === null
  ) {
    return null;
  }

  const categoryNames = product.productCategories
    .filter(({ category }) => category.isActive)
    .map(({ category }) => category.name);

  return projectProductFields(product, categoryNames);
}
