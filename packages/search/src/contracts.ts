import type { OrderStatus, products } from "@repo/db/public/schema";

export type ProductSearchStatus = (typeof products.$inferSelect)["status"];

export type SearchTextSegment = {
  text: string;
  matched: boolean;
};

export type SearchExcerpt = {
  source: "description" | "category" | "sku";
  segments: SearchTextSegment[];
};

type SearchPreviewBase = {
  id: string;
  title: string;
  href: string;
  excerpt?: SearchExcerpt;
};

export type PublicProductPreview = SearchPreviewBase & {
  type: "product";
  slug: string;
  thumbnailUrl: string | null;
  categoryNames: string[];
};

export type CategoryPreview = SearchPreviewBase & {
  type: "category";
  slug: string;
};

export type AdminProductPreview = PublicProductPreview & {
  status: ProductSearchStatus;
  isActive: boolean;
};

export type OrderPreview = SearchPreviewBase & {
  type: "order";
  reference: string;
  checkoutEmail: string;
  status: OrderStatus;
  totalAmount: number;
  createdAt: string;
  archivedAt: string | null;
};

export type CustomerPreview = SearchPreviewBase & {
  type: "customer";
  email: string;
  image: string | null;
};

export type StaffPreview = SearchPreviewBase & {
  type: "staff";
  email: string;
  image: string | null;
  role: string | null;
  banned: boolean;
};

export type PublicSearchPreview = PublicProductPreview | CategoryPreview;

export type AdminSearchPreview =
  | AdminProductPreview
  | CategoryPreview
  | OrderPreview
  | CustomerPreview
  | StaffPreview;

export type SearchPreview = PublicSearchPreview | AdminSearchPreview;

export type SearchResultGroup<T extends SearchPreview = SearchPreview> = {
  type: T["type"];
  results: T[];
};

export type SearchResponse<T extends SearchPreview = SearchPreview> = {
  query: string;
  groups: SearchResultGroup<T>[];
};
