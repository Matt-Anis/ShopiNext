import { index, integer, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { products } from "./products";

export const images = pgTable(
  "images",
  {
    id: uuid().primaryKey().defaultRandom(),
    url: text().notNull(),
    altText: text(),
    order: integer().notNull().default(0),
    productId: uuid()
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
  },
  (table) => [
    index("images_productId_idx").on(table.productId),
    index("images_productId_order_idx").on(table.productId, table.order),
  ],
);

export const imagesRelations = relations(images, ({ one }) => ({
  product: one(products, {
    fields: [images.productId],
    references: [products.id],
  }),
}));
