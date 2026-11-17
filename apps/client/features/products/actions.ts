"use server";

import {
  getAllProducts,
  getProductBySlug,
  type ProductCursor,
} from "@/features/products/queries";
import type { ProductDiscovery } from "./discovery";
import { productPageRequestSchema } from "./pagination";

export async function loadMoreProducts(
  cursor: ProductCursor,
  settings: Partial<ProductDiscovery> & { categoryId?: string } = {},
) {
  return getAllProducts(productPageRequestSchema.parse({ ...settings, cursor }));
}

export async function fetchProductBySlug(slug: string) {
  const product = await getProductBySlug(slug);

  return product;
}
