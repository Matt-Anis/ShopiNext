import type { SearchReadDatabase } from "../db/client";
import type { SearchPageOptions } from "./pagination";

export function readPublicProductsPage(
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
    where: (product, { and, eq, gt, isNotNull }) =>
      and(
        eq(product.isActive, true),
        eq(product.status, "active"),
        isNotNull(product.minPrice),
        page.entityId ? eq(product.id, page.entityId) : undefined,
        page.afterId ? gt(product.id, page.afterId) : undefined,
      ),
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
    },
  });
}

export function readCategoriesPage(
  db: SearchReadDatabase,
  page: SearchPageOptions,
) {
  return db.query.categories.findMany({
    columns: {
      id: true,
      name: true,
      slug: true,
      description: true,
      isActive: true,
    },
    where: (category, { and, eq, gt }) =>
      and(
        eq(category.isActive, true),
        page.entityId ? eq(category.id, page.entityId) : undefined,
        page.afterId ? gt(category.id, page.afterId) : undefined,
      ),
    orderBy: (category, { asc }) => [asc(category.id)],
    limit: page.limit,
  });
}
