"use client";

import { useRef, useState } from "react";
import { SearchIcon } from "lucide-react";
import type { RecentSearchHistory } from "@repo/search/browser";
import { useSearch, type SearchExecutor } from "../hooks/use-search";
import { useRecentSearches } from "../hooks/use-recent-searches";
import { Button } from "./button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./sheet";
import { SearchPanel } from "./search-panel";

type GlobalSearchProps = {
  search: SearchExecutor;
  available: boolean;
  onNavigate: (href: string) => void;
  label: string;
  className?: string;
  history?: RecentSearchHistory;
  presentation?: "input" | "drawer";
};

export function GlobalSearch({
  search,
  available,
  onNavigate,
  label,
  className,
  history,
  presentation = "input",
}: GlobalSearchProps) {
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { state, setQuery, reset } = useSearch(search, available);
  const recent = useRecentSearches(history);

  function changeOpen(next: boolean) {
    setOpen(next);
    if (!next) reset();
    else if (available) recent.load();
  }

  const panel = (
    <SearchPanel
      state={state}
      label={label}
      available={available}
      inputRef={inputRef}
      open={open}
      inline={presentation === "drawer"}
      onOpenChange={changeOpen}
      onQueryChange={setQuery}
      recentQueries={recent.queries}
      onQueryCommit={() => recent.remember(state.query)}
      onRecentSelect={(query) => {
        setQuery(query);
        inputRef.current?.focus();
      }}
      onRecentRemove={(query) => {
        recent.remove(query);
        inputRef.current?.focus();
      }}
      onHistoryClear={() => {
        recent.clear();
        inputRef.current?.focus();
      }}
      onSelect={(result) => {
        recent.remember(state.query);
        changeOpen(false);
        onNavigate(result.href);
      }}
    />
  );

  if (presentation === "input") {
    return <div className={className}>{panel}</div>;
  }

  return (
    <div className={className}>
      <Sheet open={open} onOpenChange={changeOpen}>
        <SheetTrigger
          render={<Button variant="ghost" size="icon" aria-label={label} />}
        >
          <SearchIcon aria-hidden="true" />
        </SheetTrigger>
        <SheetContent
          initialFocus={available ? inputRef : undefined}
          className="w-full gap-2 sm:max-w-lg"
        >
          <SheetHeader>
            <SheetTitle>Search</SheetTitle>
            <SheetDescription className="sr-only">{label}</SheetDescription>
          </SheetHeader>
          <div className="min-h-0 overflow-y-auto px-6 pb-6">{panel}</div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
