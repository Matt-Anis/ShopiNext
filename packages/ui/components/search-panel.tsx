"use client";

import type { RefObject } from "react";
import { LoaderCircle, SearchIcon } from "lucide-react";
import type { SearchPreview } from "@repo/search/contracts";
import { SEARCH_LIMITS } from "@repo/search/public";
import type { SearchState } from "../hooks/use-search";
import { Button } from "./button";
import {
  Combobox,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
} from "./combobox";
import { InputGroupAddon } from "./input-group";
import { SearchResult } from "./search-result";

const groupLabels = {
  product: "Products",
  category: "Categories",
  order: "Orders",
  customer: "Customers",
  staff: "Staff",
};

type SearchPanelProps = {
  state: SearchState;
  label: string;
  inputRef: RefObject<HTMLInputElement | null>;
  onQueryChange: (query: string) => void;
  onSelect: (result: SearchPreview) => void;
  onClose: () => void;
};

export function SearchPanel({
  state,
  label,
  inputRef,
  onQueryChange,
  onSelect,
  onClose,
}: SearchPanelProps) {
  const groups = state.groups.filter((group) => group.results.length > 0);
  const results = groups.flatMap((group) => group.results);
  return (
    <Combobox<SearchPreview>
      inline
      open
      items={results}
      filter={null}
      value={null}
      inputValue={state.query}
      itemToStringLabel={(item) => item.title}
      isItemEqualToValue={(item, value) =>
        item.type === value.type && item.id === value.id
      }
      onInputValueChange={(value, details) => {
        if (
          details.reason === "input-change" ||
          details.reason === "clear-press"
        )
          onQueryChange(value);
      }}
      onValueChange={(item) => {
        if (item) onSelect(item);
      }}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      autoComplete="off"
    >
      <ComboboxInput
        ref={inputRef}
        aria-label={label}
        placeholder={label}
        maxLength={SEARCH_LIMITS.maxQueryLength}
        showTrigger={false}
        showClear
        className="w-full"
      >
        <InputGroupAddon align="inline-start">
          <SearchIcon aria-hidden="true" />
        </InputGroupAddon>
      </ComboboxInput>
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="text-sm text-muted-foreground"
      >
        {state.status === "idle" && (
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
          <p className={results.length ? "sr-only" : "px-3 py-5"}>
            {results.length
              ? `${results.length} results available.`
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
      <ComboboxList
        aria-label="Search results"
        aria-busy={state.status === "loading"}
        className="max-h-[min(55dvh,28rem)]"
      >
        {groups.map((group) => (
          <ComboboxGroup key={group.type}>
            <ComboboxLabel>{groupLabels[group.type]}</ComboboxLabel>
            {group.results.map((result) => (
              <ComboboxItem
                key={`${result.type}:${result.id}`}
                value={result}
                className="items-start py-3 pr-3"
              >
                <SearchResult result={result} />
              </ComboboxItem>
            ))}
          </ComboboxGroup>
        ))}
      </ComboboxList>
    </Combobox>
  );
}
