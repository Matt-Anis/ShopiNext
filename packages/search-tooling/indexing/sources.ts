import { PUBLIC_SEARCH_INDEXES } from "@repo/search/public";
import type { SearchEntityType } from "@repo/db/admin/schema";
import {
  ADMIN_SEARCH_INDEXES,
  type SearchIndexUid,
} from "@repo/search/server/indexes";
import type { SearchReadDatabase } from "../db/client";
import { projectAdminProduct } from "../projections/admin-products";
import { projectCategory } from "../projections/categories";
import { projectOrder } from "../projections/orders";
import { projectCustomer, projectStaff } from "../projections/people";
import { projectPublicProduct } from "../projections/products";
import { readAdminProductsPage } from "../queries/admin-catalog";
import { readOrdersPage } from "../queries/orders";
import type { SearchPageOptions } from "../queries/pagination";
import { isCanonicalEntityId } from "../queries/entity-id";
import { readCustomersPage, readStaffPage } from "../queries/people";
import {
  readCategoriesPage,
  readPublicProductsPage,
} from "../queries/public-catalog";
import {
  projectDocumentPage,
  type DocumentPage,
  type IndexDocument,
} from "./pages";

export type IndexSource = {
  entityType: SearchEntityType;
  uid: SearchIndexUid;
  readEntity: (
    db: SearchReadDatabase,
    id: string,
  ) => Promise<IndexDocument | null>;
  readPage: (
    db: SearchReadDatabase,
    page: SearchPageOptions,
  ) => Promise<DocumentPage>;
};

function createSource<T extends IndexDocument, D extends IndexDocument>(
  entityType: SearchEntityType,
  uid: SearchIndexUid,
  readRows: (db: SearchReadDatabase, page: SearchPageOptions) => Promise<T[]>,
  project: (row: T) => D | null,
): IndexSource {
  return {
    entityType,
    uid,
    async readEntity(db, id) {
      if (!isCanonicalEntityId(entityType, id)) return null;
      const rows = await readRows(db, { entityId: id, limit: 1 });
      return rows[0] ? project(rows[0]) : null;
    },
    async readPage(db, page) {
      return projectDocumentPage(await readRows(db, page), page.limit, project);
    },
  };
}

export const INDEX_SOURCES: IndexSource[] = [
  createSource(
    "product",
    PUBLIC_SEARCH_INDEXES.products,
    readPublicProductsPage,
    projectPublicProduct,
  ),
  createSource(
    "category",
    PUBLIC_SEARCH_INDEXES.categories,
    readCategoriesPage,
    projectCategory,
  ),
  createSource(
    "product",
    ADMIN_SEARCH_INDEXES.products,
    readAdminProductsPage,
    projectAdminProduct,
  ),
  createSource(
    "category",
    ADMIN_SEARCH_INDEXES.categories,
    readCategoriesPage,
    projectCategory,
  ),
  createSource(
    "order",
    ADMIN_SEARCH_INDEXES.orders,
    readOrdersPage,
    projectOrder,
  ),
  createSource(
    "customer",
    ADMIN_SEARCH_INDEXES.customers,
    readCustomersPage,
    projectCustomer,
  ),
  createSource(
    "staff",
    ADMIN_SEARCH_INDEXES.staff,
    readStaffPage,
    projectStaff,
  ),
];
