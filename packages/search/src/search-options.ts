import type { SearchParams } from "meilisearch";
import { HIGHLIGHT_END, HIGHLIGHT_START } from "./excerpts";
import { SEARCH_LIMITS } from "./public";

export function previewSearchOptions(
  attributesToRetrieve: string[],
  attributesToSearchOn: string[],
  attributesToHighlight: string[],
): SearchParams {
  return {
    limit: SEARCH_LIMITS.resultsPerGroup,
    attributesToRetrieve,
    attributesToSearchOn,
    attributesToHighlight,
    attributesToCrop: attributesToHighlight.includes("description")
      ? ["description:24"]
      : [],
    cropMarker: "…",
    highlightPreTag: HIGHLIGHT_START,
    highlightPostTag: HIGHLIGHT_END,
    showMatchesPosition: true,
  };
}
