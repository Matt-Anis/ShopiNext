import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { images } from "./images";
import { productCategories } from "./categories";
import { productOptions, productVariants } from "./variants";

export const products = pgTable(
  "products",
  {
    id: uuid().primaryKey().defaultRandom(),
    name: text().notNull(),
    slug: text().notNull(),
    description: text(),
    minPrice: integer(),
    isActive: boolean().notNull().default(true),
    createdAt: timestamp().defaultNow().notNull(),
    updatedAt: timestamp()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("products_slug_active_unique")
      .on(table.slug)
      .where(sql`${table.isActive}`),
    index("products_createdAt_id_idx")
      .on(table.createdAt, table.id)
      .where(sql`${table.isActive}`),
    index("products_minPrice_id_idx")
      .on(table.minPrice, table.id)
      .where(sql`${table.minPrice} is not null and ${table.isActive}`),
  ],
);

export const productsRelations = relations(products, ({ many }) => ({
  images: many(images),
  productCategories: many(productCategories),
  options: many(productOptions),
  variants: many(productVariants),
}));
