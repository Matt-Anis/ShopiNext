import type { SearchReadDatabase } from "../db/client";
import type { SearchPageOptions } from "./pagination";

export function readAdminProductsPage(
  db: SearchReadDatabase,
  page: SearchPageOptions,
) {
  return db.query.products.findMany({
    columns: {
      id: true,
      name: true,
      slug: true,
      description: true,
      isActive: true,
      status: true,
      minPrice: true,
    },
    where: (product, { gt }) =>
      page.afterId ? gt(product.id, page.afterId) : undefined,
    orderBy: (product, { asc }) => [asc(product.id)],
    limit: page.limit,
    with: {
      images: {
        columns: { url: true },
        orderBy: (image, { asc }) => [asc(image.order), asc(image.id)],
        limit: 1,
      },
      productCategories: {
        columns: {},
        with: { category: { columns: { name: true, isActive: true } } },
      },
      variants: {
        columns: { sku: true, isActive: true },
        where: (variant, { eq }) => eq(variant.isActive, true),
        orderBy: (variant, { asc }) => [asc(variant.sku)],
      },
    },
  });
}
