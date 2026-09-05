import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { products } from "./products";

export const productOptions = pgTable(
  "product_options",
  {
    id: uuid().primaryKey().defaultRandom(),
    productId: uuid()
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    name: text().notNull(),
  },
  (table) => [
    unique("product_options_productId_name_unique").on(
      table.productId,
      table.name,
    ),
    index("product_options_productId_idx").on(table.productId),
  ],
);

export const productOptionValues = pgTable(
  "product_option_values",
  {
    id: uuid().primaryKey().defaultRandom(),
    optionId: uuid()
      .notNull()
      .references(() => productOptions.id, { onDelete: "cascade" }),
    value: text().notNull(),
  },
  (table) => [
    unique("product_option_values_optionId_value_unique").on(
      table.optionId,
      table.value,
    ),
    index("product_option_values_optionId_idx").on(table.optionId),
  ],
);

export const productVariants = pgTable(
  "product_variants",
  {
    id: uuid().primaryKey().defaultRandom(),
    productId: uuid()
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    sku: text().notNull(),
    price: integer().notNull().default(0),
    stock: integer().notNull().default(0),
    maxPerOrder: integer().notNull(),
    // Soft-delete only: false means trashed, to preserve order history that
    // references this row. Not a draft/unpublished flag — see docs/database.md.
    isActive: boolean().notNull().default(true),
    createdAt: timestamp().defaultNow().notNull(),
    updatedAt: timestamp()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("product_variants_productId_idx").on(table.productId),
    uniqueIndex("product_variants_sku_active_unique")
      .on(table.sku)
      .where(sql`${table.isActive}`),
  ],
);

export const variantOptionValues = pgTable(
  "variant_option_values",
  {
    id: uuid().primaryKey().defaultRandom(),
    variantId: uuid()
      .notNull()
      .references(() => productVariants.id, { onDelete: "cascade" }),
    optionValueId: uuid()
      .notNull()
      .references(() => productOptionValues.id, { onDelete: "cascade" }),
  },
  (table) => [
    unique("variant_option_values_variantId_optionValueId_unique").on(
      table.variantId,
      table.optionValueId,
    ),
    index("variant_option_values_optionValueId_idx").on(table.optionValueId),
  ],
);

export const productOptionsRelations = relations(
  productOptions,
  ({ one, many }) => ({
    product: one(products, {
      fields: [productOptions.productId],
      references: [products.id],
    }),
    values: many(productOptionValues),
  }),
);

export const productOptionValuesRelations = relations(
  productOptionValues,
  ({ one, many }) => ({
    option: one(productOptions, {
      fields: [productOptionValues.optionId],
      references: [productOptions.id],
    }),
    variantOptionValues: many(variantOptionValues),
  }),
);

export const productVariantsRelations = relations(
  productVariants,
  ({ one, many }) => ({
    product: one(products, {
      fields: [productVariants.productId],
      references: [products.id],
    }),
    variantOptionValues: many(variantOptionValues),
  }),
);

export const variantOptionValuesRelations = relations(
  variantOptionValues,
  ({ one }) => ({
    variant: one(productVariants, {
      fields: [variantOptionValues.variantId],
      references: [productVariants.id],
    }),
    optionValue: one(productOptionValues, {
      fields: [variantOptionValues.optionValueId],
      references: [productOptionValues.id],
    }),
  }),
);
