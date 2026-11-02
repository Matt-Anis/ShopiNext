"use server";

import {
  getAllProducts,
  getProductBySlug,
  type ProductCursor,
} from "@/features/products/queries";

export async function loadMoreProducts(
  cursor: ProductCursor,
  categoryId?: string
) {
  return getAllProducts({ cursor, categoryId });
}

export async function fetchProductBySlug(slug: string) {
  const product = await getProductBySlug(slug);

  return product;
}
