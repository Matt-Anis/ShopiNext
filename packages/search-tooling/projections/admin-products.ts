import type { AdminProductDocument } from "@repo/search/server/documents";
import { projectProductFields, type ProductProjectionSource } from "./products";

export type AdminProductProjectionSource = ProductProjectionSource & {
  variants: { sku: string; isActive: boolean }[];
};

export function projectAdminProduct(
  product: AdminProductProjectionSource,
): AdminProductDocument {
  const categoryNames = product.productCategories.map(
    ({ category }) => category.name,
  );
  const skus = product.variants
    .filter((variant) => variant.isActive)
    .map((variant) => variant.sku);

  return {
    ...projectProductFields(product, categoryNames),
    skus: [...new Set(skus)].sort((a, b) => a.localeCompare(b, "en")),
    status: product.status,
    isActive: product.isActive,
  };
}
