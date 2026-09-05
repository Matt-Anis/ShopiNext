import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { adminUser } from "../../admin/auth-schema";
import { products } from "./products";

export const categories = pgTable(
  "categories",
  {
    id: uuid().primaryKey().defaultRandom(),
    name: text().notNull(),
    description: text(),
    // Soft-delete only: false means trashed, to preserve product-category
    // associations for products that reference this row. Not a draft/unpublished
    // flag — see docs/database.md.
    isActive: boolean().notNull().default(true),
    updatedBy: text().references(() => adminUser.id, { onDelete: "set null" }),
    createdAt: timestamp().defaultNow().notNull(),
    updatedAt: timestamp()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("categories_name_active_unique")
      .on(table.name)
      .where(sql`${table.isActive}`),
  ],
);

export const productCategories = pgTable(
  "product_categories",
  {
    id: uuid().primaryKey().defaultRandom(),
    productId: uuid()
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    categoryId: uuid()
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
  },
  (table) => [
    unique("product_categories_productId_categoryId_unique").on(
      table.productId,
      table.categoryId,
    ),
    index("product_categories_categoryId_idx").on(table.categoryId),
  ],
);

export const categoriesRelations = relations(categories, ({ many, one }) => ({
  productCategories: many(productCategories),
  updatedByAdmin: one(adminUser, {
    fields: [categories.updatedBy],
    references: [adminUser.id],
  }),
}));

export const productCategoriesRelations = relations(
  productCategories,
  ({ one }) => ({
    product: one(products, {
      fields: [productCategories.productId],
      references: [products.id],
    }),
    category: one(categories, {
      fields: [productCategories.categoryId],
      references: [categories.id],
    }),
  }),
);
