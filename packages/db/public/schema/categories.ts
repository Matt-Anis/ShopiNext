import { index, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { adminUser } from "../../admin/auth-schema";
import { products } from "./products";

export const categories = pgTable("categories", {
  id: uuid().primaryKey().defaultRandom(),
  name: text().unique().notNull(),
  description: text(),
  updatedBy: text().references(() => adminUser.id, { onDelete: "set null" }),
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp()
    .$onUpdate(() => new Date())
    .notNull(),
});

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
