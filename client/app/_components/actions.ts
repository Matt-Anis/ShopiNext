"use server";

import { getAllProducts, type ProductCursor } from "@/db/queries";

export async function loadMoreProducts(cursor: ProductCursor) {
  return getAllProducts({ cursor });
}
