"use client";

import { useState } from "react";
import type { RecentSearchHistory } from "@repo/search/browser";

export function useRecentSearches(history?: RecentSearchHistory) {
  const [queries, setQueries] = useState<string[]>([]);
  return {
    queries,
    load: () => setQueries(history?.read() ?? []),
    remember: (query: string) => setQueries(history?.remember(query) ?? []),
    remove: (query: string) => setQueries(history?.remove(query) ?? []),
    clear: () => {
      history?.clear();
      setQueries([]);
    },
  };
}
