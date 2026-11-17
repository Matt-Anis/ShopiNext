import { PUBLIC_SEARCH_INDEXES } from "../public";

export const ADMIN_SEARCH_INDEXES = {
  products: "admin_products",
  categories: "admin_categories",
  orders: "admin_orders",
  customers: "admin_customers",
  staff: "admin_staff",
} as const;

export const PUBLIC_SEARCH_INDEX_UIDS = Object.values(PUBLIC_SEARCH_INDEXES);
export const ADMIN_SEARCH_INDEX_UIDS = Object.values(ADMIN_SEARCH_INDEXES);
export const SEARCH_INDEX_UIDS = [
  ...PUBLIC_SEARCH_INDEX_UIDS,
  ...ADMIN_SEARCH_INDEX_UIDS,
];

export type SearchIndexUid = (typeof SEARCH_INDEX_UIDS)[number];
