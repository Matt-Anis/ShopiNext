import { Autocomplete } from "@base-ui/react/autocomplete";
import { LoaderCircle } from "lucide-react";
import type { SearchPreview } from "@repo/search/contracts";
import { SEARCH_LIMITS } from "@repo/search/public";
import type { SearchState } from "../hooks/use-search";
import { Button } from "./button";
import { SearchHistory } from "./search-history";
import { SearchResult } from "./search-result";

const groupLabels = {
  product: "Products",
  category: "Categories",
  order: "Orders",
  customer: "Customers",
  staff: "Staff",
};

type SearchSuggestionsProps = {
  state: SearchState;
  onQueryChange: (query: string) => void;
  onSelect: (result: SearchPreview) => void;
  recentQueries: string[];
  onRecentSelect: (query: string) => void;
  onRecentRemove: (query: string) => void;
  onHistoryClear: () => void;
};

export function SearchSuggestions({
  state,
  onQueryChange,
  onSelect,
  recentQueries,
  onRecentSelect,
  onRecentRemove,
  onHistoryClear,
}: SearchSuggestionsProps) {
  const groups = state.groups.filter((group) => group.results.length > 0);
  const count = groups.reduce(
    (total, group) => total + group.results.length,
    0,
  );

  return (
    <>
      {!state.query.trim() && recentQueries.length > 0 && (
        <SearchHistory
          queries={recentQueries}
          onSelect={onRecentSelect}
          onRemove={onRecentRemove}
          onClear={onHistoryClear}
        />
      )}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="text-sm text-muted-foreground"
      >
        {state.status === "idle" &&
          (state.query.trim() || recentQueries.length === 0) && (
            <p className="px-3 py-5">
              Type at least {SEARCH_LIMITS.minQueryLength} characters to search.
            </p>
          )}
        {state.status === "loading" && (
          <p className="flex items-center gap-2 px-3 py-5">
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
            Searching…
          </p>
        )}
        {state.status === "ready" && (
          <p className={count ? "sr-only" : "px-3 py-5"}>
            {count
              ? `${count} results available.`
              : `No results for “${state.query.trim()}”.`}
          </p>
        )}
        {state.status === "error" && (
          <div className="px-3 py-4">
            <p>{state.error}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => onQueryChange(state.query)}
            >
              Try again
            </Button>
          </div>
        )}
      </div>
      <Autocomplete.List
        aria-label="Search results"
        aria-busy={state.status === "loading"}
        className="max-h-[min(55dvh,28rem)] overflow-y-auto overscroll-contain"
      >
        {groups.map((group) => (
          <Autocomplete.Group key={group.type}>
            <Autocomplete.GroupLabel className="px-3 py-2 text-xs font-medium text-muted-foreground">
              {groupLabels[group.type]}
            </Autocomplete.GroupLabel>
            {group.results.map((result) => (
              <Autocomplete.Item
                key={`${result.type}:${result.id}`}
                value={result}
                onClick={() => onSelect(result)}
                className="flex cursor-pointer items-start gap-3 rounded-lg p-3 outline-none data-highlighted:bg-accent data-highlighted:text-accent-foreground"
              >
                <SearchResult result={result} />
              </Autocomplete.Item>
            ))}
          </Autocomplete.Group>
        ))}
      </Autocomplete.List>
    </>
  );
}
