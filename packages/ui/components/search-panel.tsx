"use client";

import type { RefObject } from "react";
import { Autocomplete } from "@base-ui/react/autocomplete";
import { SearchIcon } from "lucide-react";
import type { SearchPreview } from "@repo/search/contracts";
import { SEARCH_LIMITS } from "@repo/search/public";
import type { SearchState } from "../hooks/use-search";
import { InputGroup, InputGroupAddon, InputGroupInput } from "./input-group";
import { SearchSuggestions } from "./search-suggestions";
import { SearchUnavailable } from "./search-unavailable";

type SearchPanelProps = {
  state: SearchState;
  label: string;
  available: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
  open: boolean;
  inline: boolean;
  onOpenChange: (open: boolean) => void;
  onQueryChange: (query: string) => void;
  onSelect: (result: SearchPreview) => void;
  recentQueries: string[];
  onQueryCommit: () => void;
  onRecentSelect: (query: string) => void;
  onRecentRemove: (query: string) => void;
  onHistoryClear: () => void;
};

export function SearchPanel({
  state,
  label,
  available,
  inputRef,
  open,
  inline,
  onOpenChange,
  onQueryChange,
  onQueryCommit,
  ...suggestions
}: SearchPanelProps) {
  const results = state.groups.flatMap((group) => group.results);
  const content = available ? (
    <SearchSuggestions
      state={state}
      onQueryChange={onQueryChange}
      {...suggestions}
    />
  ) : (
    <SearchUnavailable />
  );

  return (
    <Autocomplete.Root<SearchPreview>
      inline={inline}
      open={inline || open}
      openOnInputClick
      items={results}
      filter={null}
      value={state.query}
      itemToStringValue={(item) => item.title}
      onValueChange={(value, details) => {
        if (
          details.reason === "input-change" ||
          details.reason === "clear-press"
        )
          onQueryChange(value);
      }}
      onOpenChange={(next) => {
        if (!inline || !next) onOpenChange(next);
      }}
    >
      <InputGroup className="h-9 w-full min-w-0 rounded-[var(--control-radius,var(--radius-lg))] bg-muted/40">
        <Autocomplete.Input
          render={<InputGroupInput />}
          ref={inputRef}
          aria-label={label}
          placeholder={available ? "Search…" : "Search · Local demo"}
          autoComplete="off"
          readOnly={!available}
          maxLength={SEARCH_LIMITS.maxQueryLength}
          onFocus={() => {
            if (!inline) onOpenChange(true);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.nativeEvent.isComposing)
              onQueryCommit();
          }}
        />
        <InputGroupAddon align="inline-start">
          <SearchIcon aria-hidden="true" />
        </InputGroupAddon>
      </InputGroup>
      {inline ? (
        <div className="mt-3">{content}</div>
      ) : (
        <Autocomplete.Portal>
          <Autocomplete.Positioner sideOffset={8} align="end" className="z-50">
            <Autocomplete.Popup
              data-slot="search-popup"
              initialFocus={false}
              finalFocus={false}
              className="max-h-(--available-height) w-[min(30rem,calc(100vw-2rem))] max-w-(--available-width) overflow-y-auto rounded-xl border border-border bg-popover p-2 text-popover-foreground shadow-lg outline-none"
            >
              {content}
            </Autocomplete.Popup>
          </Autocomplete.Positioner>
        </Autocomplete.Portal>
      )}
    </Autocomplete.Root>
  );
}
