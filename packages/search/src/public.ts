export const PUBLIC_SEARCH_INDEXES = {
  products: "public_products",
  categories: "public_categories",
} as const;

export const SEARCH_LIMITS = {
  minQueryLength: 2,
  maxQueryLength: 200,
  resultsPerGroup: 5,
  debounceMs: 250,
  historyEntries: 10,
} as const;
