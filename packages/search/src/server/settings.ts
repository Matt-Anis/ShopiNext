import type { Settings } from "meilisearch";
import { PUBLIC_SEARCH_INDEXES } from "../public";
import type {
  AdminProductDocument,
  CategoryDocument,
  CustomerDocument,
  OrderDocument,
  PublicProductDocument,
  StaffDocument,
} from "./documents";
import { ADMIN_SEARCH_INDEXES, type SearchIndexUid } from "./indexes";

type SettingsFields<T> = {
  displayedAttributes: Extract<keyof T, string>[];
  searchableAttributes: Extract<keyof T, string>[];
  exactAttributes: Extract<keyof T, string>[];
};

function createSettings<T>({
  displayedAttributes,
  searchableAttributes,
  exactAttributes,
}: SettingsFields<T>): Settings {
  return {
    displayedAttributes,
    searchableAttributes,
    localizedAttributes: [
      { attributePatterns: searchableAttributes, locales: ["eng"] },
    ],
    typoTolerance: {
      enabled: true,
      minWordSizeForTypos: { oneTypo: 5, twoTypos: 5 },
      disableOnAttributes: exactAttributes,
      disableOnNumbers: true,
    },
  };
}

const categorySettings = createSettings<CategoryDocument>({
  displayedAttributes: ["id", "name", "slug", "description"],
  searchableAttributes: ["name", "slug", "description", "id"],
  exactAttributes: ["id", "slug"],
});

export const SEARCH_INDEX_SETTINGS = {
  [PUBLIC_SEARCH_INDEXES.products]: createSettings<PublicProductDocument>({
    displayedAttributes: [
      "id",
      "name",
      "slug",
      "description",
      "thumbnailUrl",
      "categoryNames",
    ],
    searchableAttributes: ["name", "categoryNames", "description"],
    exactAttributes: ["id", "slug"],
  }),
  [PUBLIC_SEARCH_INDEXES.categories]: createSettings<CategoryDocument>({
    displayedAttributes: ["id", "name", "slug", "description"],
    searchableAttributes: ["name", "description"],
    exactAttributes: ["id", "slug"],
  }),
  [ADMIN_SEARCH_INDEXES.products]: createSettings<AdminProductDocument>({
    displayedAttributes: [
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
    searchableAttributes: [
      "name",
      "skus",
      "slug",
      "categoryNames",
      "description",
      "id",
    ],
    exactAttributes: ["id", "slug", "skus"],
  }),
  [ADMIN_SEARCH_INDEXES.categories]: categorySettings,
  [ADMIN_SEARCH_INDEXES.orders]: createSettings<OrderDocument>({
    displayedAttributes: [
      "id",
      "reference",
      "checkoutEmail",
      "status",
      "totalAmount",
      "createdAt",
      "archivedAt",
    ],
    searchableAttributes: ["reference", "id", "checkoutEmail"],
    exactAttributes: ["reference", "id", "checkoutEmail"],
  }),
  [ADMIN_SEARCH_INDEXES.customers]: createSettings<CustomerDocument>({
    displayedAttributes: ["id", "name", "email", "image"],
    searchableAttributes: ["name", "email", "id"],
    exactAttributes: ["id", "email"],
  }),
  [ADMIN_SEARCH_INDEXES.staff]: createSettings<StaffDocument>({
    displayedAttributes: ["id", "name", "email", "image", "role", "banned"],
    searchableAttributes: ["name", "email", "id"],
    exactAttributes: ["id", "email"],
  }),
} satisfies Record<SearchIndexUid, Settings>;
