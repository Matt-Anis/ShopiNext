import type { MultiSearchQuery } from "meilisearch";
import type { AdminSearchPreview } from "../contracts";
import { previewSearchOptions } from "../search-options";
import { ADMIN_SEARCH_INDEXES } from "./indexes";

export type AdminSearchGroup = AdminSearchPreview["type"];

export type AdminSearchAccess = {
  groups: AdminSearchGroup[];
  maskEmail?: (email: string) => string;
};

const definitions = {
  product: {
    indexUid: ADMIN_SEARCH_INDEXES.products,
    retrieve: [
      "id",
      "name",
      "slug",
      "description",
      "thumbnailUrl",
      "categoryNames",
      "skus",
      "status",
      "isActive",
    ],
    search: ["name", "skus", "slug", "categoryNames", "description", "id"],
    highlight: ["skus", "categoryNames", "description"],
  },
  category: {
    indexUid: ADMIN_SEARCH_INDEXES.categories,
    retrieve: ["id", "name", "slug", "description"],
    search: ["name", "slug", "description", "id"],
    highlight: ["description"],
  },
  order: {
    indexUid: ADMIN_SEARCH_INDEXES.orders,
    retrieve: [
      "id",
      "reference",
      "checkoutEmail",
      "status",
      "totalAmount",
      "createdAt",
      "archivedAt",
    ],
    search: ["reference", "id", "checkoutEmail"],
    highlight: [],
  },
  customer: {
    indexUid: ADMIN_SEARCH_INDEXES.customers,
    retrieve: ["id", "name", "email", "image"],
    search: ["name", "email", "id"],
    highlight: [],
  },
  staff: {
    indexUid: ADMIN_SEARCH_INDEXES.staff,
    retrieve: ["id", "name", "email", "image", "role", "banned"],
    search: ["name", "email", "id"],
    highlight: [],
  },
} satisfies Record<
  AdminSearchGroup,
  {
    indexUid: string;
    retrieve: string[];
    search: string[];
    highlight: string[];
  }
>;

export function adminIndexUid(group: AdminSearchGroup): string {
  return definitions[group].indexUid;
}

export function adminSearchQueries(
  query: string,
  access: AdminSearchAccess,
): MultiSearchQuery[] {
  return [...new Set(access.groups)].map((group) => {
    const definition = definitions[group];
    const searchable = access.maskEmail
      ? definition.search.filter(
          (field) => field !== "email" && field !== "checkoutEmail",
        )
      : definition.search;
    return {
      indexUid: definition.indexUid,
      q: query,
      ...previewSearchOptions(
        definition.retrieve,
        searchable,
        definition.highlight,
      ),
    };
  });
}
