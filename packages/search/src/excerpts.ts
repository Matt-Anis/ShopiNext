import type { Hit } from "meilisearch";
import type { SearchExcerpt, SearchTextSegment } from "./contracts";

export const HIGHLIGHT_START = "\uE000";
export const HIGHLIGHT_END = "\uE001";

export function highlightSegments(value: string): SearchTextSegment[] {
  const segments: SearchTextSegment[] = [];
  let matched = false;
  for (const part of value.split(/(\uE000|\uE001)/u)) {
    if (part === HIGHLIGHT_START) matched = true;
    else if (part === HIGHLIGHT_END) matched = false;
    else if (part) segments.push({ text: part, matched });
  }
  return segments;
}

type ExcerptFields = {
  description?: string;
  categoryNames?: string[];
  skus?: string[];
};

const excerptSources = {
  description: "description",
  categoryNames: "category",
  skus: "sku",
} as const;

export function createSearchExcerpt(
  hit: Hit<ExcerptFields>,
  attributes: (keyof ExcerptFields)[],
): SearchExcerpt | undefined {
  for (const attribute of attributes) {
    if (!hit._matchesPosition?.[attribute]?.length) continue;
    const formatted = hit._formatted?.[attribute];
    const text = Array.isArray(formatted)
      ? formatted.find((value) => value.includes(HIGHLIGHT_START))
      : formatted;
    if (text) {
      return {
        source: excerptSources[attribute],
        segments: highlightSegments(text),
      };
    }
  }
  return undefined;
}
