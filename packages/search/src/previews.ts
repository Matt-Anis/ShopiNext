import type { Hit } from "meilisearch";
import type { CategoryPreview, PublicProductPreview } from "./contracts";
import { createSearchExcerpt } from "./excerpts";
import type {
  CategoryDocument,
  PublicProductDocument,
} from "./server/documents";

export function productPreview(
  hit: Hit<PublicProductDocument>,
  href: string,
): PublicProductPreview {
  return {
    type: "product",
    id: hit.id,
    title: hit.name,
    href,
    slug: hit.slug,
    thumbnailUrl: hit.thumbnailUrl,
    categoryNames: hit.categoryNames,
    excerpt: createSearchExcerpt(hit, ["categoryNames", "description"]),
  };
}

export function categoryPreview(
  hit: Hit<CategoryDocument>,
  href: string,
): CategoryPreview {
  return {
    type: "category",
    id: hit.id,
    title: hit.name,
    href,
    slug: hit.slug,
    excerpt: createSearchExcerpt(hit, ["description"]),
  };
}
