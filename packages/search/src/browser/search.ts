import { Meilisearch, type Hit, type MultiSearchParams } from "meilisearch";
import type { PublicSearchPreview, SearchResponse } from "../contracts";
import { categoryPreview, productPreview } from "../previews";
import { PUBLIC_SEARCH_INDEXES, SEARCH_LIMITS } from "../public";
import { isSearchQueryReady, normalizeSearchQuery } from "../query";
import { previewSearchOptions } from "../search-options";
import type {
  CategoryDocument,
  PublicProductDocument,
} from "../server/documents";

type PublicSearchConnection = { url: string; apiKey: string };

export async function searchPublicIndexes(
  connection: PublicSearchConnection,
  value: string,
  signal?: AbortSignal,
): Promise<SearchResponse<PublicSearchPreview>> {
  const query = normalizeSearchQuery(value);
  signal?.throwIfAborted();
  if (!isSearchQueryReady(query)) return { query, groups: [] };
  const client = new Meilisearch({
    host: connection.url,
    apiKey: connection.apiKey,
    timeout: 5_000,
  });
  const response = await client.multiSearch<
    MultiSearchParams,
    PublicProductDocument | CategoryDocument
  >(
    {
      queries: [
        {
          indexUid: PUBLIC_SEARCH_INDEXES.products,
          q: query,
          ...previewSearchOptions(
            [
              "id",
              "name",
              "slug",
              "description",
              "thumbnailUrl",
              "categoryNames",
            ],
            ["name", "categoryNames", "description"],
            ["categoryNames", "description"],
          ),
        },
        {
          indexUid: PUBLIC_SEARCH_INDEXES.categories,
          q: query,
          ...previewSearchOptions(
            ["id", "name", "slug", "description"],
            ["name", "description"],
            ["description"],
          ),
        },
      ],
    },
    { signal },
  );
  signal?.throwIfAborted();
  const products = response.results.find(
    (result) => result.indexUid === PUBLIC_SEARCH_INDEXES.products,
  );
  const categories = response.results.find(
    (result) => result.indexUid === PUBLIC_SEARCH_INDEXES.categories,
  );
  return {
    query,
    groups: [
      {
        type: "product",
        results: (products?.hits ?? [])
          .slice(0, SEARCH_LIMITS.resultsPerGroup)
          .map((hit) =>
            productPreview(
              hit as Hit<PublicProductDocument>,
              `/products/${encodeURIComponent(hit.slug)}`,
            ),
          ),
      },
      {
        type: "category",
        results: (categories?.hits ?? [])
          .slice(0, SEARCH_LIMITS.resultsPerGroup)
          .map((hit) =>
            categoryPreview(
              hit as Hit<CategoryDocument>,
              `/categories/${encodeURIComponent(hit.slug)}`,
            ),
          ),
      },
    ],
  };
}
