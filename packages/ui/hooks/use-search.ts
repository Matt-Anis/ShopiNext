"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SearchResponse, SearchResultGroup } from "@repo/search/contracts";
import { SEARCH_LIMITS } from "@repo/search/public";
import { isSearchQueryReady, normalizeSearchQuery } from "@repo/search/query";

export type SearchExecutor = (
  query: string,
  signal: AbortSignal,
) => Promise<SearchResponse>;

export type SearchState = {
  query: string;
  groups: SearchResultGroup[];
  status: "idle" | "loading" | "ready" | "error";
  error?: string;
};

const initialState: SearchState = { query: "", groups: [], status: "idle" };

export function useSearch(search: SearchExecutor, available: boolean) {
  const [state, setState] = useState(initialState);
  const request = useRef<AbortController | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const generation = useRef(0);

  const cancel = useCallback(() => {
    generation.current += 1;
    request.current?.abort();
    request.current = null;
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
  }, []);

  useEffect(() => cancel, [cancel]);

  const reset = useCallback(() => {
    cancel();
    setState(initialState);
  }, [cancel]);

  const setQuery = useCallback(
    (value: string) => {
      cancel();
      if (!available) {
        setState(initialState);
        return;
      }
      let query: string;
      try {
        query = normalizeSearchQuery(value);
      } catch (error) {
        setState({
          query: value,
          groups: [],
          status: "error",
          error:
            error instanceof Error ? error.message : "Invalid search query.",
        });
        return;
      }
      if (!isSearchQueryReady(query)) {
        setState({ query: value, groups: [], status: "idle" });
        return;
      }
      setState({ query: value, groups: [], status: "loading" });
      const current = generation.current;
      timer.current = setTimeout(async () => {
        const controller = new AbortController();
        request.current = controller;
        try {
          const response = await search(query, controller.signal);
          if (current === generation.current && !controller.signal.aborted) {
            setState({
              query: value,
              groups: response.groups,
              status: "ready",
            });
          }
        } catch (error) {
          if (current === generation.current && !controller.signal.aborted) {
            setState({
              query: value,
              groups: [],
              status: "error",
              error:
                error instanceof Error
                  ? error.message
                  : "Search is unavailable. Please try again.",
            });
          }
        }
      }, SEARCH_LIMITS.debounceMs);
    },
    [available, cancel, search],
  );

  return { state, setQuery, reset };
}
