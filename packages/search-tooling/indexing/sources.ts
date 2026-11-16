import { PUBLIC_SEARCH_INDEXES } from "@repo/search/public";
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
  uid: SearchIndexUid;
  readPage: (
    db: SearchReadDatabase,
    page: SearchPageOptions,
  ) => Promise<DocumentPage>;
};

function createSource<T extends IndexDocument, D extends IndexDocument>(
  uid: SearchIndexUid,
  readRows: (db: SearchReadDatabase, page: SearchPageOptions) => Promise<T[]>,
  project: (row: T) => D | null,
): IndexSource {
  return {
    uid,
    async readPage(db, page) {
      return projectDocumentPage(await readRows(db, page), page.limit, project);
    },
  };
}

export const INDEX_SOURCES: IndexSource[] = [
  createSource(
    PUBLIC_SEARCH_INDEXES.products,
    readPublicProductsPage,
    projectPublicProduct,
  ),
  createSource(
    PUBLIC_SEARCH_INDEXES.categories,
    readCategoriesPage,
    projectCategory,
  ),
  createSource(
    ADMIN_SEARCH_INDEXES.products,
    readAdminProductsPage,
    projectAdminProduct,
  ),
  createSource(
    ADMIN_SEARCH_INDEXES.categories,
    readCategoriesPage,
    projectCategory,
  ),
  createSource(ADMIN_SEARCH_INDEXES.orders, readOrdersPage, projectOrder),
  createSource(
    ADMIN_SEARCH_INDEXES.customers,
    readCustomersPage,
    projectCustomer,
  ),
  createSource(ADMIN_SEARCH_INDEXES.staff, readStaffPage, projectStaff),
];
