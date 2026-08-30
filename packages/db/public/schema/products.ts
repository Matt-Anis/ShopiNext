import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { images } from "./images";
import { productCategories } from "./categories";
import { productOptions, productVariants } from "./variants";

export const products = pgTable(
  "products",
  {
    id: uuid().primaryKey().defaultRandom(),
    name: text().notNull(),
    slug: text().unique().notNull(),
    description: text(),
    createdAt: timestamp().defaultNow().notNull(),
    updatedAt: timestamp()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("products_createdAt_id_idx").on(table.createdAt, table.id)],
);

export const productsRelations = relations(products, ({ many }) => ({
  images: many(images),
  productCategories: many(productCategories),
  options: many(productOptions),
  variants: many(productVariants),
}));
