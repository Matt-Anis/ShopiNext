"use server";

import {
  getAllProducts,
  getProductBySlug,
  type ProductCursor,
} from "@/db/queries";

export async function loadMoreProducts(cursor: ProductCursor) {
  return getAllProducts({ cursor });
}

export async function fetchProductBySlug(slug: string) {
  const product = await getProductBySlug(slug);

  return product;
}
