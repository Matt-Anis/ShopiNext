export const SEARCH_UNAVAILABLE_MESSAGE =
  "Search is available in the local demo. See the setup guide to try it.";

export const SEARCH_SETUP_URL =
  "https://github.com/Matt-Anis/ShopiNext/blob/HEAD/docs/search.md";

export function isSearchAvailable(nodeEnv: string | undefined): boolean {
  return nodeEnv !== "production";
}
