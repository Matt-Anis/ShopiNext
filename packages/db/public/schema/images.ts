import { boolean, index, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { products } from "./products";

export const images = pgTable(
  "images",
  {
    id: uuid().primaryKey().defaultRandom(),
    url: text().notNull(),
    altText: text(),
    isPrimary: boolean().notNull().default(false),
    productId: uuid()
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
  },
  (table) => [
    index("images_productId_idx").on(table.productId),
    index("images_primary_idx")
      .on(table.productId)
      .where(sql`${table.isPrimary} = true`),
  ],
);

export const imagesRelations = relations(images, ({ one }) => ({
  product: one(products, {
    fields: [images.productId],
    references: [products.id],
  }),
}));
