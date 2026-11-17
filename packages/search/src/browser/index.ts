export { getPublicSearchConnection } from "./environment";
export { searchPublicIndexes } from "./search";
export {
  ADMIN_RECENT_SEARCH_PREFIX,
  PUBLIC_RECENT_SEARCH_KEY,
  clearAdminSearchHistory,
  createAdminSearchHistory,
  createPublicSearchHistory,
  createRecentSearchHistory,
  type RecentSearchHistory,
} from "./history";
